// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./ModuleSelfAuth.sol";
import "./ModuleStorage.sol";
import "./ModuleERC165.sol";
import "./ModuleNonce.sol";
import "./ModuleOnlyDelegatecall.sol";

import "./interfaces/IModuleCalls.sol";
import "./interfaces/IModuleAuth.sol";

import "./submodules/nonce/SubModuleNonce.sol";
import "./submodules/auth/SequenceBaseSig.sol";

import "../../utils/LibOptim.sol";


abstract contract ModuleCalls is IModuleCalls, IModuleAuth, ModuleERC165, ModuleOnlyDelegatecall, ModuleSelfAuth, ModuleNonce {
  /**
   * @notice Allow wallet owner to execute an action
   * @dev Relayers must ensure that the gasLimit specified for each transaction
   *      is acceptable to them. A user could specify large enough that it could
   *      consume all the gas available.
   * @param _txs        Transactions to process
   * @param _nonce      Signature nonce (may contain an encoded space)
   * @param _signature  Encoded signature
   */
  function execute(
    Transaction[] calldata _txs,
    uint256 _nonce,
    bytes calldata _signature
  ) external override virtual onlyDelegatecall {
    // Validate and update nonce
    _validateNonce(_nonce);

    // Hash and verify transaction bundle
    (bool isValid, bytes32 txHash) = _signatureValidation(
      keccak256(
        abi.encode(
          _nonce,
          _txs
        )
      ),
      _signature
    );

    if (!isValid) {
      revert InvalidSignature(txHash, _signature);
    }

    // Execute the transactions
    _execute(txHash, _txs);
  }

  /**
   * @notice Allow wallet to execute an action
   *   without signing the message
   * @param _txs  Transactions to execute
   */
  function selfExecute(
    Transaction[] calldata _txs
  ) external override virtual onlySelf {
    // Hash transaction bundle
    bytes32 txHash = SequenceBaseSig.subdigest(
      keccak256(
        abi.encode('self:', _txs)
      )
    );

    // Execute the transactions
    _execute(txHash, _txs);
  }

  /**
   * @notice Executes a list of transactions
   * @param _txHash  Hash of the batch of transactions
   * @param _txs  Transactions to execute
   */
  function _execute(
    bytes32 _txHash,
    Transaction[] calldata _txs
  ) private {
    unchecked {
      // Execute transaction
      uint256 size = _txs.length;
      for (uint256 i = 0; i < size; i++) {
        Transaction calldata transaction = _txs[i];
        uint256 gasLimit = transaction.gasLimit;

        if (gasleft() < gasLimit) revert NotEnoughGas(i, gasLimit, gasleft());

        bool success;
        if (transaction.delegateCall) {
          success = LibOptim.delegatecall(
            transaction.target,
            gasLimit == 0 ? gasleft() : gasLimit,
            transaction.data
          );
        } else {
          success = LibOptim.call(
            transaction.target,
            transaction.value,
            gasLimit == 0 ? gasleft() : gasLimit,
            transaction.data
          );
        }

        if (success) {
          emit TxExecuted(_txHash, i);
        } else {
          // Avoid copy of return data until neccesary
          _revertBytes(
            transaction.revertOnError,
            _txHash,
            i,
            LibOptim.returnData()
          );
        }
      }
    }
  }

  /**
   * @notice Logs a failed transaction, reverts if the transaction is not optional
   * @param _revertOnError  Signals if it should revert or just log
   * @param _txHash         Hash of the transaction
   * @param _index          Index of the transaction in the batch
   * @param _reason         Encoded revert message
   */
  function _revertBytes(
    bool _revertOnError,
    bytes32 _txHash,
    uint256 _index,
    bytes memory _reason
  ) internal {
    if (_revertOnError) {
      assembly { revert(add(_reason, 0x20), mload(_reason)) }
    } else {
      emit TxFailed(_txHash, _index, _reason);
    }
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(bytes4 _interfaceID) public override virtual pure returns (bool) {
    if (_interfaceID == type(IModuleCalls).interfaceId) {
      return true;
    }

    return super.supportsInterface(_interfaceID);
  }
}

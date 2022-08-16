// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;
pragma experimental ABIEncoderV2;

import "./ModuleSelfAuth.sol";
import "./ModuleStorage.sol";
import "./ModuleERC165.sol";

import "./interfaces/IModuleCalls.sol";
import "./interfaces/IModuleAuth.sol";

import "./submodules/nonce/SubModuleNonce.sol";
import "./submodules/auth/SequenceBaseSig.sol";

import "../../utils/LibOptim.sol";


abstract contract ModuleCalls is IModuleCalls, IModuleAuth, ModuleERC165, ModuleSelfAuth {
  //                       NONCE_KEY = keccak256("org.arcadeum.module.calls.nonce");
  bytes32 private constant NONCE_KEY = bytes32(0x8d0bf1fd623d628c741362c1289948e57b3e2905218c676d3e69abee36d6ae2e);

  // - @notice: For backwards comaptibility reasons GAP_NONCE_KEY must match the one previously defined in GapNonceUtils.
  // 
  //                        GAP_NONCE_KEY = keccak256("org.sequence.module.gapnonce.nonce");
  bytes32 internal constant GAP_NONCE_KEY = bytes32(keccak256("org.sequence.module.gapnonce.nonce"));

  /**
   * @notice Returns the next nonce of the default nonce space
   * @dev The default nonce space is 0x00
   * @return The next nonce
   */
  function nonce() external override virtual view returns (uint256) {
    return readNonce(0);
  }

  /**
   * @notice Returns the next nonce of the given nonce space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @return The next nonce
   */
  function readNonce(uint256 _space) public override virtual view returns (uint256) {
    return uint256(ModuleStorage.readBytes32Map(NONCE_KEY, bytes32(_space)));
  }

  /**
   * @notice Changes the next nonce of the given nonce space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @param _nonce Nonce to write on the space
   */
  function _writeNonce(uint256 _space, uint256 _nonce) internal {
    ModuleStorage.writeBytes32Map(NONCE_KEY, bytes32(_space), bytes32(_nonce));
  }

  /**
   * @notice Returns the current nonce for a given gap space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @return The current nonce
   */
  function readGapNonce(uint256 _space) public override virtual view returns (uint256) {
    return uint256(ModuleStorage.readBytes32Map(GAP_NONCE_KEY, bytes32(_space)));
  }

  /**
   * @notice Changes the gap nonce of the given space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @param _nonce Nonce to write to the space
   */
  function _writeGapNonce(uint256 _space, uint256 _nonce) internal {
    ModuleStorage.writeBytes32Map(GAP_NONCE_KEY, bytes32(_space), bytes32(_nonce));
  }

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
    Transaction[] memory _txs,
    uint256 _nonce,
    bytes calldata _signature
  ) external override virtual {
    // Validate and update nonce
    _validateNonce(_nonce);

    // Hash and verify transaction bundle
    (bool isValid, bytes32 txHash) = _signatureValidation(keccak256(abi.encode(_nonce, _txs)), _signature);
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
    Transaction[] memory _txs
  ) external override virtual onlySelf {
    // Hash transaction bundle
    bytes32 txHash = SequenceBaseSig.subDigest(keccak256(abi.encode('self:', _txs)));

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
    Transaction[] memory _txs
  ) private {
    unchecked {
      // Execute transaction
      uint256 size = _txs.length;
      for (uint256 i = 0; i < size; i++) {
        Transaction memory transaction = _txs[i];
        uint256 gasLimit = transaction.gasLimit;

        if (gasleft() < gasLimit) revert NotEnoughGas(gasLimit, gasleft());

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
          emit TxExecuted(_txHash);
        } else {
          // Avoid copy of return data until neccesary
          _revertBytes(transaction, _txHash, LibOptim.returnData());
        }
      } 
    }
  }

  /**
   * @notice Verify if a nonce is valid
   * @param _rawNonce Nonce to validate (may contain an encoded space)
   * @dev A valid nonce must be above the last one used
   *   with a maximum delta of 100
   */
  function _validateNonce(uint256 _rawNonce) internal virtual {
    // Retrieve current nonce for this wallet
    (uint256 space, uint256 nonceType, uint256 providedNonce) = SubModuleNonce.decodeNonce(_rawNonce);

    // Normal nonce type is an auto-incremental nonce
    // that increments by 1 each time it is used.
    if (nonceType == SubModuleNonce.TypeNormalNonce) {
      uint256 currentNonce = readNonce(space);
      if (currentNonce != providedNonce) {
        revert BadNonce(space, providedNonce, currentNonce);
      }

      unchecked {
        uint256 newNonce = providedNonce + 1;

        _writeNonce(space, newNonce);
        emit NonceChange(space, newNonce);
        return;
      }

    // Gap nonce type is an incremental nonce
    // that may be used to skip an arbitrary number of transactions.
    } else if (nonceType == SubModuleNonce.TypeGapNonce) {
      uint256 currentGapNonce = readGapNonce(space);

      if (providedNonce <= currentGapNonce) {
        revert BadGapNonce(space, providedNonce, currentGapNonce);
      }

      _writeGapNonce(space, providedNonce);
      emit GapNonceChange(space, currentGapNonce, providedNonce);
      return;

    // No nonce type is a transaction that doesn't contain a nonce
    // and can be executed repeatedly forever.
    // @notice: This is dangerous, use with care.
    } else if (nonceType == SubModuleNonce.TypeNoNonce) {
      // Space and nonce must be 0 (for security reasons)
      if (space != 0 || providedNonce != 0) {
        revert ExpectedEmptyNonce(space, providedNonce);
      }
      emit NoNonceUsed();
      return;

    }

    // Shouldn't be possible to reach this
    // becuase decoding the nonce validates the type
    assert(false);
  }

  /**
   * @notice Logs a failed transaction, reverts if the transaction is not optional
   * @param _tx      Transaction that is reverting
   * @param _txHash  Hash of the transaction
   * @param _reason  Encoded revert message
   */
  function _revertBytes(
    Transaction memory _tx,
    bytes32 _txHash,
    bytes memory _reason
  ) internal {
    if (_tx.revertOnError) {
      assembly { revert(add(_reason, 0x20), mload(_reason)) }
    } else {
      emit TxFailed(_txHash, _reason);
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

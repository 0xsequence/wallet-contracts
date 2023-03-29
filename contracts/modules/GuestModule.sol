// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "../utils/LibOptim.sol";

import "./commons/submodules/auth/SequenceBaseSig.sol";

import "./commons/ModuleAuth.sol";
import "./commons/ModuleCalls.sol";
import "./commons/ModuleCreator.sol";


/**
 * GuestModule implements a Sequence wallet without signatures, nonce or replay protection.
 * executing transactions using this wallet is not an authenticated process, and can be done by any address.
 *
 * @notice This contract is completely public with no security, designed to execute pre-signed transactions
 *   and use Sequence tools without using the wallets.
 */
contract GuestModule is
  ModuleAuth,
  ModuleCalls,
  ModuleCreator
{
  error DelegateCallNotAllowed(uint256 _index);
  error NotSupported();

  /**
   * @notice Allow any caller to execute an action
   * @param _txs Transactions to process
   */
  function execute(
    Transaction[] calldata _txs,
    uint256,
    bytes calldata
  ) public override {
    // Hash transaction bundle
    bytes32 txHash = SequenceBaseSig.subdigest(keccak256(abi.encode('guest:', _txs)));

    // Execute the transactions
    _executeGuest(txHash, _txs);
  }

  /**
   * @notice Allow any caller to execute an action
   * @param _txs Transactions to process
   */
  function selfExecute(
    Transaction[] calldata _txs
  ) public override {
    // Hash transaction bundle
    bytes32 txHash = SequenceBaseSig.subdigest(keccak256(abi.encode('self:', _txs)));

    // Execute the transactions
    _executeGuest(txHash, _txs);
  }

  /**
   * @notice Executes a list of transactions
   * @param _txHash  Hash of the batch of transactions
   * @param _txs  Transactions to execute
   */
  function _executeGuest(
    bytes32 _txHash,
    Transaction[] calldata _txs
  ) private {
    // Execute transaction
    uint256 size = _txs.length;
    for (uint256 i = 0; i < size; i++) {
      Transaction calldata transaction = _txs[i];

      if (transaction.delegateCall) revert DelegateCallNotAllowed(i);

      uint256 gasLimit = transaction.gasLimit;
      if (gasleft() < gasLimit) revert NotEnoughGas(i, gasLimit, gasleft());

      bool success = LibOptim.call(
        transaction.target,
        transaction.value,
        gasLimit == 0 ? gasleft() : gasLimit,
        transaction.data
      );

      if (success) {
        emit TxExecuted(_txHash, i);
      } else {
        _revertBytes(
          transaction.revertOnError,
          _txHash,
          i,
          LibOptim.returnData()
        );
      }
    }
  }

  /**
   * @notice Validates any signature image, because the wallet is public and has no owner.
   * @return true, all signatures are valid.
   */
  function _isValidImage(bytes32) internal override pure returns (bool) {
    return true;
  }

  /**
   * Not supported.
   */
  function _updateImageHash(bytes32) internal override virtual {
    revert NotSupported();
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(
    bytes4 _interfaceID
  ) public override (
    ModuleAuth,
    ModuleCalls,
    ModuleCreator
  ) pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

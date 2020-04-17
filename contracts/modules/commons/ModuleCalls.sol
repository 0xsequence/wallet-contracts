pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "./interfaces/IModuleAuth.sol";


abstract contract ModuleCalls is IModuleAuth {
  // Transaction structure
  struct Transaction {
    bool delegateCall;   // Performs delegatecall
    bool revertOnError;  // Reverts transaction bundle if tx fails
    uint256 gasLimit;    // Maximum gas to be forwarded
    address target;      // Address of the contract to call
    uint256 value;       // Amount of ETH to pass with the call
    bytes data;          // calldata to pass
  }

  // Wallet's signature nonce
  uint256 public nonce = 0;

  // Events
  event NonceChange(uint256 newNonce);
  event TxFailed(uint256 _index, bytes _reason);

  /**
   * @notice Allow wallet owner to execute an action
   * @param _txs        Transactions to process
   * @param _nonce      Signature nonce
   * @param _signature  Encoded signature
   */
  function execute(
    Transaction[] memory _txs,
    uint256 _nonce,
    bytes memory _signature
  )
    public
  {
    // Validate and update nonce
    _validateNonce(_nonce);

    // Verify that signatures are valid
    require(
      _signatureValidation(_hashData(abi.encode(_nonce, _txs)), _signature),
      "MainModule#_signatureValidation: INVALID_SIGNATURE"
    );

    // Execute transaction
    for (uint256 i = 0; i < _txs.length; i++) {
      Transaction memory transaction = _txs[i];

      bool success;
      bytes memory result;

      if (transaction.delegateCall) {
        (success, result) = transaction.target.delegatecall{
          gas: transaction.gasLimit
        }(transaction.data);
      } else {
        (success, result) = transaction.target.call{
          value: transaction.value,
          gas: transaction.gasLimit
        }(transaction.data);
      }

      if (!success) _revertBytes(transaction, i, result);
    }
  }

  /**
   * @notice Verify if a nonce is valid
   * @param _nonce Nonce to validate
   * @dev A valid nonce must be above the last one used
   *   with a maximum delta of 100
   */
  function _validateNonce(uint256 _nonce) private {
    // Retrieve current nonce for this wallet
    uint256 current_nonce = nonce; // Lowest valid nonce for signer

    // Verify if nonce is valid
    require(
      (_nonce >= current_nonce) && (_nonce < (current_nonce + 100)),
      "MainModule#_auth: INVALID_NONCE"
    );

    // Update signature nonce
    nonce = _nonce + 1;
    emit NonceChange(_nonce + 1);
  }

  /**
   * @notice Logs a failed transaction, reverts if the transaction is not optional
   * @param _tx      Transaction that is reverting
   * @param _index   Index of transaction in batch
   * @param _reason  Encoded revert message
   */
  function _revertBytes(Transaction memory _tx, uint256 _index, bytes memory _reason) internal {
    if (_tx.revertOnError) {
      assembly { revert(add(_reason, 0x20), mload(_reason)) }
    } else {
      emit TxFailed(_index, _reason);
    }
  }
}

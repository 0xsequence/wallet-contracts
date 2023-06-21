// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


interface IModuleCalls {
  // Events
  event TxFailed(bytes32 indexed _tx, uint256 _index, bytes _reason);
  event TxExecuted(bytes32 indexed _tx, uint256 _index);

  // Errors
  error NotEnoughGas(uint256 _index, uint256 _requested, uint256 _available);
  error InvalidSignature(bytes32 _hash, bytes _signature);

  // Transaction structure
  struct Transaction {
    bool delegateCall;   // Performs delegatecall
    bool revertOnError;  // Reverts transaction bundle if tx fails
    uint256 gasLimit;    // Maximum gas to be forwarded
    address target;      // Address of the contract to call
    uint256 value;       // Amount of ETH to pass with the call
    bytes data;          // calldata to pass
  }

  /**
   * @notice Allow wallet owner to execute an action
   * @param _txs        Transactions to process
   * @param _nonce      Signature nonce (may contain an encoded space)
   * @param _signature  Encoded signature
   */
  function execute(
    Transaction[] calldata _txs,
    uint256 _nonce,
    bytes calldata _signature
  ) external;

  /**
   * @notice Allow wallet to execute an action
   *   without signing the message
   * @param _txs  Transactions to execute
   */
  function selfExecute(
    Transaction[] calldata _txs
  ) external;
}

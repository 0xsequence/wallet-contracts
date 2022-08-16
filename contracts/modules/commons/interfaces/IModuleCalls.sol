// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;
pragma experimental ABIEncoderV2;


interface IModuleCalls {
  // Events
  event GapNonceChange(uint256 _space, uint256 _oldNonce, uint256 _newNonce);
  event NonceChange(uint256 _space, uint256 _newNonce);
  event NoNonceUsed();

  event TxFailed(bytes32 _tx, bytes _reason);
  event TxExecuted(bytes32 _tx) anonymous;

  // Errors
  error NotEnoughGas(uint256 _requested, uint256 _available);
  error InvalidSignature(bytes32 _hash, bytes _signature);
  error BadNonce(uint256 _space, uint256 _provided, uint256 _current);
  error BadGapNonce(uint256 _space, uint256 _provided, uint256 _current);
  error ExpectedEmptyNonce(uint256 _space, uint256 _nonce);

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
   * @notice Returns the next nonce of the default nonce space
   * @dev The default nonce space is 0x00
   * @return The next nonce
   */
  function nonce() external view returns (uint256);

  /**
   * @notice Returns the next nonce of the given nonce space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @return The next nonce
   */
  function readNonce(uint256 _space) external view returns (uint256);

  /**
   * @notice Returns the current nonce for a given gap space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @return The current nonce
   */
  function readGapNonce(uint256 _space) external view returns (uint256);

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
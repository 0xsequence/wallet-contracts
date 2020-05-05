pragma solidity ^0.6.7;
pragma experimental ABIEncoderV2;

import "./ModuleStorage.sol";

import "./interfaces/IModuleAuth.sol";


abstract contract ModuleCalls is IModuleAuth {
  //                       NONCE_KEY = keccak256("org.arcadeum.module.calls.nonce");
  bytes32 private constant NONCE_KEY = bytes32(0x8d0bf1fd623d628c741362c1289948e57b3e2905218c676d3e69abee36d6ae2e);

  uint256 private constant NONCE_BITS = 96;
  bytes32 private constant NONCE_MASK = bytes32((1 << NONCE_BITS) - 1);

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
  function nonce() external view returns (uint256) {
    return readNonce(0);
  }

  /**
   * @notice Returns the next nonce of the given nonce space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @return The next nonce
   */
  function readNonce(uint256 _space) public view returns (uint256) {
    bytes32 key = keccak256(abi.encode(_space, NONCE_KEY));
    return uint256(ModuleStorage.readBytes32(key));
  }

  /**
   * @notice Changes the next nonce of th given nonce space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @param _nonce Nonce to write on the space
   */
  function _writeNonce(uint256 _space, uint256 _nonce) private {
    bytes32 key = keccak256(abi.encode(_space, NONCE_KEY));
    ModuleStorage.writeBytes32(key, bytes32(_nonce));
  }

  // Events
  event NonceChange(uint256 _space, uint256 _newNonce);
  event TxFailed(uint256 _index, bytes _reason);

  /**
   * @notice Allow wallet owner to execute an action
   * @param _txs        Transactions to process
   * @param _nonce      Signature nonce (may contain an encoded space)
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
   * @param _rawNonce Nonce to validate (may contain an encoded space)
   * @dev A valid nonce must be above the last one used
   *   with a maximum delta of 100
   */
  function _validateNonce(uint256 _rawNonce) private {
    // Retrieve current nonce for this wallet
    (uint256 space, uint256 providedNonce) = _decodeNonce(_rawNonce);
    uint256 currentNonce = readNonce(space);

    // Verify if nonce is valid
    require(
      providedNonce == currentNonce,
      "MainModule#_auth: INVALID_NONCE"
    );

    // Update signature nonce
    uint256 newNonce = providedNonce + 1;
    _writeNonce(space, newNonce);
    emit NonceChange(space, newNonce);
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

  /**
   * @notice Decodes a raw nonce
   * @dev A raw nonce is encoded using the first 160 bits for the space
   *  and the last 96 bits for the nonce
   * @param _rawNonce Nonce to be decoded
   * @return _space The nonce space of the raw nonce
   * @return _nonce The nonce of the raw nonce
   */
  function _decodeNonce(uint256 _rawNonce) private pure returns (uint256 _space, uint256 _nonce) {
    _nonce = uint256(bytes32(_rawNonce) & NONCE_MASK);
    _space = _rawNonce >> NONCE_BITS;
  }
}

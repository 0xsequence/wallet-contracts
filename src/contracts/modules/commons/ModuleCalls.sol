// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;
pragma experimental ABIEncoderV2;

import "./ModuleSelfAuth.sol";
import "./ModuleStorage.sol";
import "./ModuleERC165.sol";

import "./interfaces/IModuleCalls.sol";
import "./interfaces/IModuleAuth.sol";


abstract contract ModuleCalls is IModuleCalls, IModuleAuth, ModuleERC165, ModuleSelfAuth {
  //                       NONCE_KEY = keccak256("org.arcadeum.module.calls.nonce");
  bytes32 private constant NONCE_KEY = bytes32(0x8d0bf1fd623d628c741362c1289948e57b3e2905218c676d3e69abee36d6ae2e);

  // - @notice: For backwards comaptibility reasons GAP_NONCE_KEY must match the one previously defined in GapNonceUtils.
  // 
  //                        GAP_NONCE_KEY = keccak256("org.sequence.module.gapnonce.nonce");
  bytes32 internal constant GAP_NONCE_KEY = bytes32(keccak256("org.sequence.module.gapnonce.nonce"));


  // Nonce schema
  //
  // - @notice: Sequence v1 didn't use a "nonce type", the only type of nonce that
  //            existed was the "NormalNonce", to maintain backwards compatibility
  //            we use the type "0" for the normal type. v1 also had 96 bits allocated
  //            to the nonce, but the high order bits were always 0, since it's highly
  //            unlikely that a nonce would ever be larger than 2^32.
  //
  // space[160]:type[8]:nonce[88]
  uint256 private constant SPACE_SHIFT = 96;
  uint256 private constant TYPE_SHIFT = 88;
  uint256 private constant TYPE_MASK = 0xff;
  bytes32 private constant NONCE_MASK = bytes32((1 << TYPE_SHIFT) - 1);

  uint256 private constant TypeNormalNonce = 0;
  uint256 private constant TypeGapNonce = 1;
  uint256 private constant TypeNoNonce = 2;

  uint256 private constant HighestNonceType = TypeNoNonce;

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
  function _writeNonce(uint256 _space, uint256 _nonce) private {
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
  function _writeGapNonce(uint256 _space, uint256 _nonce) private {
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
    bytes memory _signature
  ) public override virtual {
    // Validate and update nonce
    _validateNonce(_nonce);

    // Hash transaction bundle
    bytes32 txHash = _subDigest(keccak256(abi.encode(_nonce, _txs)));

    // Verify that signatures are valid
    if (!_signatureValidation(txHash, _signature)) {
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
  ) public override virtual onlySelf {
    // Hash transaction bundle
    bytes32 txHash = _subDigest(keccak256(abi.encode('self:', _txs)));

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
      for (uint256 i = 0; i < _txs.length; i++) {
        Transaction memory transaction = _txs[i];

        bool success;
        bytes memory result;

        if (gasleft() < transaction.gasLimit) revert NotEnoughGas(transaction.gasLimit, gasleft());

        if (transaction.delegateCall) {
          (success, result) = transaction.target.delegatecall{
            gas: transaction.gasLimit == 0 ? gasleft() : transaction.gasLimit
          }(transaction.data);
        } else {
          (success, result) = transaction.target.call{
            value: transaction.value,
            gas: transaction.gasLimit == 0 ? gasleft() : transaction.gasLimit
          }(transaction.data);
        }

        if (success) {
          emit TxExecuted(_txHash);
        } else {
          _revertBytes(transaction, _txHash, result);
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
  function _validateNonce(uint256 _rawNonce) private {
    // Retrieve current nonce for this wallet
    (uint256 space, uint256 nonceType, uint256 providedNonce) = _decodeNonce(_rawNonce);

    // Normal nonce type is an auto-incremental nonce
    // that increments by 1 each time it is used.
    if (nonceType == TypeNormalNonce) {
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
    } else if (nonceType == TypeGapNonce) {
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
    } else if (nonceType == TypeNoNonce) {
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
   * @notice Decodes a raw nonce
   * @dev Schema: space[160]:type[8]:nonce[88]
   * @param _rawNonce Nonce to be decoded
   * @return _space The nonce space of the raw nonce
   * @return _type The decoded nonce type
   * @return _nonce The nonce of the raw nonce
   */
  function _decodeNonce(uint256 _rawNonce) private pure returns (
    uint256 _space,
    uint256 _type,
    uint256 _nonce
  ) {
    unchecked {
      // Decode nonce
      _space = _rawNonce >> SPACE_SHIFT;
      _type = (_rawNonce >> TYPE_SHIFT) & TYPE_MASK;
      _nonce = uint256(bytes32(_rawNonce) & NONCE_MASK);

      // Verify nonce type
      if (_type > HighestNonceType) {
        revert InvalidNonceType(_type);
      } 
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

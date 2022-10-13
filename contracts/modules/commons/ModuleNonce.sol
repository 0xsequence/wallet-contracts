// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;
pragma experimental ABIEncoderV2;

import "./ModuleStorage.sol";

import "./submodules/nonce/SubModuleNonce.sol";


contract ModuleNonce {
  // Events
  event GapNonceChange(uint256 _space, uint256 _oldNonce, uint256 _newNonce);
  event NonceChange(uint256 _space, uint256 _newNonce);
  event NoNonceUsed();

  // Errors
  error BadNonce(uint256 _space, uint256 _provided, uint256 _current);
  error BadGapNonce(uint256 _space, uint256 _provided, uint256 _current);
  error ExpectedEmptyNonce(uint256 _space, uint256 _nonce);

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
  function nonce() external virtual view returns (uint256) {
    return readNonce(0);
  }

  /**
   * @notice Returns the next nonce of the given nonce space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @return The next nonce
   */
  function readNonce(uint256 _space) public virtual view returns (uint256) {
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
  function readGapNonce(uint256 _space) public virtual view returns (uint256) {
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
}

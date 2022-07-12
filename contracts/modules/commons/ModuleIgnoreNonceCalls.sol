// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;
pragma experimental ABIEncoderV2;

import "./ModuleCalls.sol";

import "./submodules/nonce/SubModuleNonce.sol";


/**
  @notice Implements ModuleCalls but ignores the validity of the nonce
    should only be used during gas estimation.
*/
abstract contract ModuleIgnoreNonceCalls is ModuleCalls {

  /**
   * @notice Verify if a nonce is valid
   * @param _rawNonce Nonce to validate (may contain an encoded space)
   * @dev A valid nonce must be above the last one used
   *   with a maximum delta of 100
   */
  function _validateNonce(uint256 _rawNonce) internal override virtual {
    // Retrieve current nonce for this wallet
    (uint256 space, uint256 nonceType, uint256 providedNonce) = SubModuleNonce.decodeNonce(_rawNonce);

    // Normal nonce type is an auto-incremental nonce
    // that increments by 1 each time it is used.
    if (nonceType == SubModuleNonce.TypeNormalNonce) {
      uint256 currentNonce = readNonce(space);
      if (currentNonce != providedNonce && false) {
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

      if (providedNonce <= currentGapNonce && false) {
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

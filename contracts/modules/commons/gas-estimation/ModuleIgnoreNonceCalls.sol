// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./../ModuleCalls.sol";

import "./../submodules/nonce/SubModuleNonce.sol";


/**
  @notice Implements ModuleCalls but ignores the validity of the nonce
    should only be used during gas estimation.
*/
abstract contract ModuleIgnoreNonceCalls is ModuleCalls {

  /**
   * @notice Verify if a nonce is valid
   * @param _rawNonce Nonce to validate (may contain an encoded space)
   */
  function _validateNonce(uint256 _rawNonce) internal override virtual {
    // Retrieve current nonce for this wallet
    (uint256 space, uint256 providedNonce) = SubModuleNonce.decodeNonce(_rawNonce);

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
  }
}

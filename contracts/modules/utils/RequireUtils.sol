// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;
pragma experimental ABIEncoderV2;

import "../commons/ModuleNonce.sol";
import "../commons/submodules/nonce/SubModuleNonce.sol";


contract RequireUtils {
  /**
   * @notice Validates that a given expiration hasn't expired
   * @dev Used as an optional transaction on a Sequence batch, to create expirable transactions.
   *
   * @param _expiration  Expiration to check
   */
  function requireNonExpired(uint256 _expiration) external view {
    require(block.timestamp < _expiration, "RequireUtils#requireNonExpired: EXPIRED");
  }

  /**
   * @notice Validates that a given wallet has reached a given nonce
   * @dev Used as an optional transaction on a Sequence batch, to define transaction execution order
   *
   * @param _wallet Sequence wallet
   * @param _nonce  Required nonce
   */
  function requireMinNonce(address _wallet, uint256 _nonce) external view {
    (uint256 space, uint256 nonce) = _decodeNonce(_nonce);
    uint256 currentNonce = ModuleNonce(_wallet).readNonce(space);
    require(currentNonce >= nonce, "RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED");
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
    _nonce = uint256(bytes32(_rawNonce) & SubModuleNonce.NONCE_MASK);
    _space = _rawNonce >> SubModuleNonce.NONCE_BITS;
  }
}

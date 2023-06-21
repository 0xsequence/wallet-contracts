// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


library SubModuleNonce {
  // Nonce schema
  //
  // - space[160]:nonce[96]
  //
  uint256 internal constant NONCE_BITS = 96;
  bytes32 internal constant NONCE_MASK = bytes32(uint256(type(uint96).max));

  /**
   * @notice Decodes a raw nonce
   * @dev Schema: space[160]:type[96]
   * @param _rawNonce Nonce to be decoded
   * @return _space The nonce space of the raw nonce
   * @return _nonce The nonce of the raw nonce
   */
  function decodeNonce(uint256 _rawNonce) internal pure returns (
    uint256 _space,
    uint256 _nonce
  ) {
    unchecked {
      // Decode nonce
      _space = _rawNonce >> NONCE_BITS;
      _nonce = uint256(bytes32(_rawNonce) & NONCE_MASK);
    }
  }
}

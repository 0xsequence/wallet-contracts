// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;


library SubModuleNonce {
  // Nonce schema
  //
  // - @notice: Sequence v1 didn't use a "nonce type", the only type of nonce that
  //            existed was the "NormalNonce", to maintain backwards compatibility
  //            we use the type "0" for the normal type. v1 also had 96 bits allocated
  //            to the nonce, but the high order bits were always 0, since it's highly
  //            unlikely that a nonce would ever be larger than 2^32.
  //
  // space[160]:type[8]:nonce[88]
  uint256 internal constant SPACE_SHIFT = 96;
  uint256 internal constant TYPE_SHIFT = 88;
  uint256 internal constant TYPE_MASK = 0xff;
  bytes32 internal constant NONCE_MASK = bytes32((1 << TYPE_SHIFT) - 1);

  uint256 internal constant TypeNormalNonce = 0;
  uint256 internal constant TypeGapNonce = 1;
  uint256 internal constant TypeNoNonce = 2;

  uint256 internal constant HighestNonceType = TypeNoNonce;

  error InvalidNonceType(uint256 _type);

  /**
   * @notice Decodes a raw nonce
   * @dev Schema: space[160]:type[8]:nonce[88]
   * @param _rawNonce Nonce to be decoded
   * @return _space The nonce space of the raw nonce
   * @return _type The decoded nonce type
   * @return _nonce The nonce of the raw nonce
   */
  function decodeNonce(uint256 _rawNonce) internal pure returns (
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
}

pragma solidity ^0.6.8;

import "../commons/interfaces/IModuleCalls.sol";


contract RequireUtils {
  uint256 private constant NONCE_BITS = 96;
  bytes32 private constant NONCE_MASK = bytes32((1 << NONCE_BITS) - 1);

  function requireNonExpired(uint256 _expiration) external view {
    require(block.timestamp < _expiration, "RequireUtils:requireNonExpired: EXPIRED");
  }

  function requireMinNonce(address _wallet, uint256 _nonce) external view {
    (uint256 space, uint256 nonce) = _decodeNonce(_nonce);
    uint256 currentNonce = IModuleCalls(_wallet).readNonce(space);
    require(currentNonce >= nonce, "RequireUtils:requireMinNonce: NONCE_BELOW_REQUIRED");
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

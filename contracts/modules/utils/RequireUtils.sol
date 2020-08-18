pragma solidity ^0.6.8;
pragma experimental ABIEncoderV2;

import "../commons/interfaces/IModuleCalls.sol";
import "../commons/interfaces/IModuleAuthUpgradable.sol";


contract RequireUtils {
  uint256 private constant NONCE_BITS = 96;
  bytes32 private constant NONCE_MASK = bytes32((1 << NONCE_BITS) - 1);

  struct Member {
    uint256 weight;
    address signer;
  }

  event RequiredConfig(
    address indexed _wallet,
    bytes32 indexed _imageHash,
    uint256 _threshold,
    bytes _signers
  );

  function requireConfig(
    address _wallet,
    uint256 _threshold,
    Member[] calldata _members
  ) external {
    // Compute expected imageHash
    bytes32 imageHash = bytes32(uint256(_threshold));
    for (uint256 i = 0; i < _members.length; i++) {
      imageHash = keccak256(abi.encode(imageHash, _members[i].weight, _members[i].signer));
    }

    // Check against wallet imageHash
    require(IModuleAuthUpgradable(_wallet).imageHash() == imageHash, "RequireUtils#requireConfig: UNEXPECTED_IMAGE_HASH");

    // Emit event for easy config retrieval
    emit RequiredConfig(_wallet, imageHash, _threshold, abi.encode(_members));
  }

  function requireNonExpired(uint256 _expiration) external view {
    require(block.timestamp < _expiration, "RequireUtils#requireNonExpired: EXPIRED");
  }

  function requireMinNonce(address _wallet, uint256 _nonce) external view {
    (uint256 space, uint256 nonce) = _decodeNonce(_nonce);
    uint256 currentNonce = IModuleCalls(_wallet).readNonce(space);
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
    _nonce = uint256(bytes32(_rawNonce) & NONCE_MASK);
    _space = _rawNonce >> NONCE_BITS;
  }
}

pragma solidity ^0.6.5;

import "./ModuleBase.sol";
import "./ModuleAuth.sol";


abstract contract ModuleAuthSoft is ModuleBase, ModuleAuth {
  bytes32 private constant IMAGE_HASH_KEY = keccak256("org.arcadeum.module.auth.soft.image.hash");

  /**
   * @notice Updates the signers configuration of the wallet
   * @param _imageHash New required image hash of the signature
   */
  function updateImageHash(bytes32 _imageHash) external onlySelf {
    require(_imageHash != bytes32(0), "ModuleAuthSoft#updateImageHash INVALID_IMAGE_HASH");
    _writeBytes32(IMAGE_HASH_KEY, _imageHash);
  }

  /**
   * @notice Returns the current image hash of the wallet
   */
  function imageHash() external view returns (bytes32) {
    return _readBytes32(IMAGE_HASH_KEY);
  }

  /**
   * @notice Validates the signature image with a valid image hash defined
   *   in the contract storage
   * @param _image Image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes memory _image) internal override view returns (bool) {
    return keccak256(_image) == _readBytes32(IMAGE_HASH_KEY);
  }
}

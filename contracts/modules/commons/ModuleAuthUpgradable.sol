pragma solidity ^0.6.6;

import "./ModuleSelfAuth.sol";
import "./ModuleAuth.sol";
import "./ModuleStorage.sol";


abstract contract ModuleAuthUpgradable is ModuleSelfAuth, ModuleAuth {
  //                       IMAGE_HASH_KEY = keccak256("org.arcadeum.module.auth.upgradable.image.hash");
  bytes32 private constant IMAGE_HASH_KEY = bytes32(0xea7157fa25e3aa17d0ae2d5280fa4e24d421c61842aa85e45194e1145aa72bf8);

  /**
   * @notice Updates the signers configuration of the wallet
   * @param _imageHash New required image hash of the signature
   */
  function updateImageHash(bytes32 _imageHash) external onlySelf {
    require(_imageHash != bytes32(0), "ModuleAuthUpgradable#updateImageHash INVALID_IMAGE_HASH");
    ModuleStorage.writeBytes32(IMAGE_HASH_KEY, _imageHash);
  }

  /**
   * @notice Returns the current image hash of the wallet
   */
  function imageHash() external view returns (bytes32) {
    return ModuleStorage.readBytes32(IMAGE_HASH_KEY);
  }

  /**
   * @notice Validates the signature image with a valid image hash defined
   *   in the contract storage
   * @param _imageHash Hash image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes32 _imageHash) internal override view returns (bool) {
    return _imageHash == ModuleStorage.readBytes32(IMAGE_HASH_KEY);
  }
}

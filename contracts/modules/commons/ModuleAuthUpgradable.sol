// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;

import "./interfaces/IModuleAuthUpgradable.sol";

import "./ModuleSelfAuth.sol";
import "./ModuleAuth.sol";
import "./ModuleStorage.sol";


abstract contract ModuleAuthUpgradable is IModuleAuthUpgradable, ModuleAuth, ModuleSelfAuth {
  //                       IMAGE_HASH_KEY = keccak256("org.arcadeum.module.auth.upgradable.image.hash");
  bytes32 private constant IMAGE_HASH_KEY = bytes32(0xea7157fa25e3aa17d0ae2d5280fa4e24d421c61842aa85e45194e1145aa72bf8);

  event ImageHashUpdated(bytes32 newImageHash);

  /**
   * @notice Updates the signers configuration of the wallet
   * @param _imageHash New required image hash of the signature
   * @dev It is recommended to not have more than 200 signers as opcode repricing
   *      could make transactions impossible to execute as all the signers must be
   *      passed for each transaction.
   */
  function updateImageHash(bytes32 _imageHash) external override onlySelf {
    require(_imageHash != bytes32(0), "ModuleAuthUpgradable#updateImageHash INVALID_IMAGE_HASH");
    ModuleStorage.writeBytes32(IMAGE_HASH_KEY, _imageHash);
    emit ImageHashUpdated(_imageHash);
  }

  /**
   * @notice Returns the current image hash of the wallet
   */
  function imageHash() external override view returns (bytes32) {
    return ModuleStorage.readBytes32(IMAGE_HASH_KEY);
  }

  /**
   * @notice Validates the signature image with a valid image hash defined
   *   in the contract storage
   * @param _imageHash Hash image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes32 _imageHash) internal override view returns (bool) {
    return _imageHash != bytes32(0) && _imageHash == ModuleStorage.readBytes32(IMAGE_HASH_KEY);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(bytes4 _interfaceID) public override virtual pure returns (bool) {
    if (_interfaceID == type(IModuleAuthUpgradable).interfaceId) {
      return true;
    }

    return super.supportsInterface(_interfaceID);
  }
}

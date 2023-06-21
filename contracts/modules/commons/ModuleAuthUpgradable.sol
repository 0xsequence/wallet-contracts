// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./interfaces/IModuleAuthUpgradable.sol";

import "./ModuleSelfAuth.sol";
import "./ModuleAuth.sol";
import "./ModuleStorage.sol";


abstract contract ModuleAuthUpgradable is IModuleAuthUpgradable, ModuleSelfAuth, ModuleAuth {
  /**
   * @notice Updates the signers configuration of the wallet
   * @param _imageHash New required image hash of the signature
   */
  function _updateImageHash(bytes32 _imageHash) internal override virtual {
    if (_imageHash == bytes32(0)) revert ImageHashIsZero();
    ModuleStorage.writeBytes32(IMAGE_HASH_KEY, _imageHash);
    emit ImageHashUpdated(_imageHash);
  }

  /**
   * @notice Returns the current image hash of the wallet
   */
  function imageHash() external override virtual view returns (bytes32) {
    return ModuleStorage.readBytes32(IMAGE_HASH_KEY);
  }

  /**
   * @notice Validates the signature image with a valid image hash defined
   *   in the contract storage
   * @param _imageHash Hash image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes32 _imageHash) internal override virtual view returns (bool) {
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

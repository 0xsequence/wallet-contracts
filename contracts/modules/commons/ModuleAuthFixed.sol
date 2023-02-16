// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./ModuleAuth.sol";
import "./ModuleUpdate.sol";
import "./ModuleSelfAuth.sol";
import "./ModuleStorage.sol";

import "../../Wallet.sol";

/**
 *  Implements ModuleAuth by validating the signature image against
 *  the salt used to deploy the contract
 *
 *  This module allows wallets to be deployed with a default configuration
 *  without using any aditional contract storage
 */
abstract contract ModuleAuthFixed is ModuleSelfAuth, ModuleAuth, ModuleUpdate {
  bytes32 public immutable INIT_CODE_HASH;
  address public immutable FACTORY;
  address public immutable UPGRADEABLE_IMPLEMENTATION;

  constructor(address _factory, address _mainModuleUpgradeable) {
    // Build init code hash of the deployed wallets using that module
    bytes32 initCodeHash = keccak256(abi.encodePacked(Wallet.creationCode, uint256(uint160(address(this)))));

    INIT_CODE_HASH = initCodeHash;
    FACTORY = _factory;
    UPGRADEABLE_IMPLEMENTATION = _mainModuleUpgradeable;
  }

  /**
   * @notice Updates the configuration of the wallet
   * @dev In the process of updating the configuration, the wallet implementation
   *      is updated to the mainModuleUpgradeable, this only happens once in the
   *      lifetime of the wallet.
   *
   * @param _imageHash New required image hash of the signature
   */
  function _updateImageHash(bytes32 _imageHash) internal override virtual {
    // Update imageHash in storage
    if (_imageHash == bytes32(0)) revert ImageHashIsZero();
    ModuleStorage.writeBytes32(IMAGE_HASH_KEY, _imageHash);
    emit ImageHashUpdated(_imageHash);

    // Update wallet implementation to mainModuleUpgradeable
    _updateImplementation(UPGRADEABLE_IMPLEMENTATION);
  }

  /**
   * @notice Validates the signature image with the salt used to deploy the contract
   * @param _imageHash Hash image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes32 _imageHash) internal override virtual view returns (bool) {
    return address(
      uint160(
        uint256(
          keccak256(
            abi.encodePacked(
              hex"ff",
              FACTORY,
              _imageHash,
              INIT_CODE_HASH
            )
          )
        )
      )
    ) == address(this);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(bytes4 _interfaceID) public override(ModuleAuth, ModuleUpdate) virtual pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

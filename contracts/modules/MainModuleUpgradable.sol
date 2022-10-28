// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;
pragma experimental ABIEncoderV2;

import "./commons/ModuleAuthUpgradable.sol";
import "./commons/ModuleHooks.sol";
import "./commons/ModuleCalls.sol";
import "./commons/ModuleUpdate.sol";
import "./commons/ModuleCreator.sol";
import "./commons/ModuleExtraAuth.sol";
import "./commons/ModuleStaticAuth.sol";
import "./commons/ModuleAuthConvenience.sol";


/**
 * @notice Contains the core functionality arcadeum wallets will inherit with
 *         the added functionality that the main-module can be changed.
 * @dev If using a new main module, developpers must ensure that all inherited
 *      contracts by the mainmodule don't conflict and are accounted for to be
 *      supported by the supportsInterface method.
 */
contract MainModuleUpgradable is
  ModuleAuthUpgradable,
  ModuleExtraAuth,
  ModuleStaticAuth,
  ModuleCalls,
  ModuleUpdate,
  ModuleHooks,
  ModuleCreator,
  ModuleAuthConvenience
{
  function _isValidImage(
    bytes32 _imageHash
  ) internal override(
    IModuleAuth,
    ModuleAuthUpgradable,
    ModuleExtraAuth
  ) view returns (bool) {
    return super._isValidImage(_imageHash);
  }

  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal view override(
    IModuleAuth,
    ModuleAuth,
    ModuleStaticAuth
  ) returns (bool, bytes32) {
    return super._signatureValidation(_digest, _signature);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @dev If using a new main module, developpers must ensure that all inherited
   *      contracts by the mainmodule don't conflict and are accounted for to be
   *      supported by the supportsInterface method.
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(
    bytes4 _interfaceID
  ) public override(
    ModuleAuth,
    ModuleAuthUpgradable,
    ModuleCalls,
    ModuleUpdate,
    ModuleHooks,
    ModuleCreator
  ) pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

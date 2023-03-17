// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./commons/ModuleAuthUpgradable.sol";
import "./commons/ModuleHooks.sol";
import "./commons/ModuleCalls.sol";
import "./commons/ModuleUpdate.sol";
import "./commons/ModuleCreator.sol";
import "./commons/ModuleExtraAuth.sol";
import "./commons/ModuleAuthConvenience.sol";


/**
 * @notice Contains the core functionality Sequence wallets will inherit with
 *         the added functionality that the main module can be changed.
 * @dev If using a new main module, developers must ensure that all inherited
 *      contracts by the main module don't conflict and are accounted for to be
 *      supported by the supportsInterface method.
 */
contract MainModuleUpgradable is
  ModuleAuthUpgradable,
  ModuleExtraAuth,
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

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @dev If using a new main module, developers must ensure that all inherited
   *      contracts by the main module don't conflict and are accounted for to be
   *      supported by the supportsInterface method.
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(
    bytes4 _interfaceID
  ) public override(
    ModuleAuthUpgradable,
    ModuleAuthConvenience,
    ModuleCalls,
    ModuleExtraAuth,
    ModuleUpdate,
    ModuleHooks,
    ModuleCreator
  ) pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./commons/ModuleAuthFixed.sol";
import "./commons/ModuleHooks.sol";
import "./commons/ModuleCalls.sol";
import "./commons/ModuleCreator.sol";
import "./commons/ModuleExtraAuth.sol";
import "./commons/ModuleAuthConvenience.sol";


/**
 * @notice Contains the core functionality Sequence wallets will inherit.
 * @dev If using a new main module, developers must ensure that all inherited
 *      contracts by the main module don't conflict and are accounted for to be
 *      supported by the supportsInterface method.
 */
contract MainModule is
  ModuleAuthFixed,
  ModuleExtraAuth,
  ModuleCalls,
  ModuleHooks,
  ModuleCreator,
  ModuleAuthConvenience
{
  constructor(
    address _factory,
    address _mainModuleUpgradable
  ) ModuleAuthFixed(
    _factory,
    _mainModuleUpgradable
  ) { }

  function _isValidImage(
    bytes32 _imageHash
  ) internal override(
    IModuleAuth,
    ModuleAuthFixed,
    ModuleExtraAuth
  ) view returns (bool) {
    return super._isValidImage(_imageHash);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(
    bytes4 _interfaceID
  ) public override(
    ModuleAuthFixed,
    ModuleAuthConvenience,
    ModuleCalls,
    ModuleExtraAuth,
    ModuleHooks,
    ModuleCreator
  ) pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "./commons/ModuleIgnoreAuthUpgradable.sol";
import "./commons/ModuleIgnoreNonceCalls.sol";
import "./commons/ModuleHooks.sol";
import "./commons/ModuleUpdate.sol";
import "./commons/ModuleCreator.sol";


/**
 * @notice Contains an alternative implementation of the MainModules that skips validation of
 *   signatures, this implementation SHOULD NOT be used directly on a wallet.
 *
 *   Intended to be used only for gas estimation, using eth_call and overrides.
 */
contract MainModuleGasEstimation is
  ModuleIgnoreAuthUpgradable,
  ModuleIgnoreNonceCalls,
  ModuleUpdate,
  ModuleHooks,
  ModuleCreator
{

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
    ModuleIgnoreAuthUpgradable,
    ModuleIgnoreNonceCalls,
    ModuleUpdate,
    ModuleHooks,
    ModuleCreator
  ) pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

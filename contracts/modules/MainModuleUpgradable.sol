pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "./commons/ModuleAuthUpgradable.sol";
import "./commons/ModuleHooks.sol";
import "./commons/ModuleCalls.sol";
import "./commons/ModuleUpdate.sol";

contract MainModuleUpgradable is
  ModuleAuthUpgradable,
  ModuleUpdate,
  ModuleHooks,
  ModuleCalls
{ }

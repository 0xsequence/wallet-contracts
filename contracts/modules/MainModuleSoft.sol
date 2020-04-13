pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "./commons/ModuleAuthSoft.sol";
import "./commons/ModuleHooks.sol";
import "./commons/ModuleCalls.sol";
import "./commons/ModuleUpdate.sol";

contract MainModuleSoft is
  ModuleAuthSoft,
  ModuleUpdate,
  ModuleHooks,
  ModuleCalls
{ }

pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "../utils/SignatureValidator.sol";

import "./commons/Implementation.sol";
import "./commons/ModuleAuthFixed.sol";
import "./commons/ModuleHooks.sol";
import "./commons/ModuleCalls.sol";
import "./commons/ModuleUpdate.sol";

import "../interfaces/receivers/IERC1155Receiver.sol";
import "../interfaces/receivers/IERC721Receiver.sol";

import "../interfaces/IERC1271Wallet.sol";


/**
 * To do
 *   - Recovery
 *   - Force module only
 *   - private vs internal
 *   - Public vs External for main module
 */
contract MainModule is
  ModuleAuthFixed,
  ModuleUpdate,
  ModuleHooks,
  ModuleCalls
{
  constructor(
    address _factory
  ) public ModuleAuthFixed(
    _factory
  ) { }
}

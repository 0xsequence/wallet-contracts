pragma solidity ^0.6.7;
pragma experimental ABIEncoderV2;

import "../utils/SignatureValidator.sol";

import "./commons/Implementation.sol";
import "./commons/ModuleAuthFixed.sol";
import "./commons/ModuleHooks.sol";
import "./commons/ModuleCalls.sol";
import "./commons/ModuleUpdate.sol";
import "./commons/ModuleCreator.sol";

import "../interfaces/receivers/IERC1155Receiver.sol";
import "../interfaces/receivers/IERC721Receiver.sol";

import "../interfaces/IERC1271Wallet.sol";


/**
 * Contains the core functionality arcadeum wallets will inherit.
 */
contract MainModule is
  ModuleAuthFixed,
  ModuleCalls,
  ModuleUpdate,
  ModuleHooks,
  ModuleCreator
{
  constructor(
    address _factory
  ) public ModuleAuthFixed(
    _factory
  ) { }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(
    bytes4 _interfaceID
  ) public override(
    ModuleAuthFixed,
    ModuleCalls,
    ModuleUpdate,
    ModuleHooks,
    ModuleCreator
  ) view returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "./commons/ModuleWebAuthnOnly.sol";
import "./commons/ModuleHooks.sol";
import "./commons/ModuleCalls.sol";
import "./commons/ModuleCreator.sol";


/**
 *  Implement a Sequence MainModule that uses WebAuthn for authentication
 *  it only allows a 1/1 WebAuthn signature, without the possibility of rotating the key
 */
contract MainModuleWebAuthnOnly is
  ModuleWebAuthnOnly,
  ModuleCalls,
  ModuleHooks,
  ModuleCreator
{
  constructor(
    address _factory
  ) ModuleWebAuthnOnly(
    _factory
  ) { }

  function _isValidImage(
    bytes32 _imageHash
  ) internal override(
    IModuleAuth,
    ModuleWebAuthnOnly
  ) view returns (bool) {
    return super._isValidImage(_imageHash);
  }

  function signatureRecovery(
    bytes32 _digest,
    bytes calldata _signature
  ) public override(
    ModuleWebAuthnOnly,
    IModuleAuth
  ) virtual view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subdigest,
    uint256 checkpoint
  ) {
    return super.signatureRecovery(_digest, _signature);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(
    bytes4 _interfaceID
  ) public override(
    ModuleWebAuthnOnly,
    ModuleCalls,
    ModuleHooks,
    ModuleCreator
  ) pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

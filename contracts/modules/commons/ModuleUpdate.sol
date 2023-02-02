// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./interfaces/IModuleUpdate.sol";

import "./Implementation.sol";
import "./ModuleSelfAuth.sol";
import "./ModuleERC165.sol";

import "../../utils/LibAddress.sol";


contract ModuleUpdate is IModuleUpdate, ModuleERC165, ModuleSelfAuth, Implementation {
  using LibAddress for address;

  event ImplementationUpdated(address newImplementation);

  /**
   * @notice Updates the implementation of the base wallet
   * @param _implementation New main module implementation
   * @dev WARNING Updating the implementation can brick the wallet
   */
  function updateImplementation(address _implementation) external override virtual onlySelf {
    _updateImplementation(_implementation);
  }

  /**
   * @notice Updates the implementation of the base wallet, used internally.
   * @param _implementation New main module implementation
   * @dev WARNING Updating the implementation can brick the wallet
   */
  function _updateImplementation(address _implementation) internal override virtual {
    if (!_implementation.isContract()) revert InvalidImplementation(_implementation);
    _setImplementation(_implementation);
    emit ImplementationUpdated(_implementation);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(bytes4 _interfaceID) public override virtual pure returns (bool) {
    if (_interfaceID == type(IModuleUpdate).interfaceId) {
      return true;
    }

    return super.supportsInterface(_interfaceID);
  }
}

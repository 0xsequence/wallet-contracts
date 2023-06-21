// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


abstract contract IModuleUpdate {
  // Errors
  error InvalidImplementation(address _implementation);

  /**
   * @notice Updates the implementation of the base wallet
   * @param _implementation New main module implementation
   * @dev WARNING Updating the implementation can brick the wallet
   */
  function updateImplementation(address _implementation) external virtual;

  /**
   * @notice Updates the implementation of the base wallet, used internally.
   * @param _implementation New main module implementation
   * @dev WARNING Updating the implementation can brick the wallet
   */
  function _updateImplementation(address _implementation) internal virtual;
}

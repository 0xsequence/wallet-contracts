// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;


interface IModuleUpdate {
  /**
   * @notice Updates the implementation of the base wallet
   * @param _implementation New main module implementation
   * @dev WARNING Updating the implementation can brick the wallet
   */
  function updateImplementation(address _implementation) external;
}

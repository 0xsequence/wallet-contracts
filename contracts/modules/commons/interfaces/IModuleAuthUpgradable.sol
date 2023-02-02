// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


interface IModuleAuthUpgradable {
  /**
   * @notice Returns the current image hash of the wallet
   */
  function imageHash() external view returns (bytes32);
}

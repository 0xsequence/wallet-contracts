// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


interface IModuleHooks {
  // Errors
  error HookAlreadyExists(bytes4 _signature);
  error HookDoesNotExist(bytes4 _signature);

  // Events
  event DefinedHook(bytes4 _signature, address _implementation);

  /**
   * @notice Reads the implementation hook of a signature
   * @param _signature Signature function
   * @return The address of the implementation hook, address(0) if none
  */
  function readHook(bytes4 _signature) external view returns (address);

  /**
   * @notice Adds a new hook to handle a given function selector
   * @param _signature Signature function linked to the hook
   * @param _implementation Hook implementation contract
   */
  function addHook(bytes4 _signature, address _implementation) external;

  /**
   * @notice Removes a registered hook
   * @param _signature Signature function linked to the hook
   */
  function removeHook(bytes4 _signature) external;
}

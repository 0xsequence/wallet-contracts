// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


interface IModuleCreator {
  error CreateFailed(bytes _code);

  /**
   * @notice Creates a contract forwarding eth value
   * @param _code Creation code of the contract
   * @return addr The address of the created contract
   */
  function createContract(bytes calldata _code) external payable returns (address addr);
}

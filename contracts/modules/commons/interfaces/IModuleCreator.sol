pragma solidity ^0.6.8;


interface IModuleCreator {
  /**
   * @notice Creates a contract forwarding eth value
   * @param _code Creation code of the contract
   * @return addr The address of the created contract
   */
  function createContract(bytes calldata _code) external payable returns (address addr);
}

pragma solidity ^0.6.7;
pragma experimental ABIEncoderV2;

import "./ModuleSelfAuth.sol";


contract ModuleCreator is ModuleSelfAuth {
  event CreatedContract(address _contract);

  /**
   * @notice Creates a contract forwarding eth value
   * @param _code Creation code of the contract
   * @return addr The address of the created contract
   */
  function createContract(bytes memory _code) public payable onlySelf returns (address addr) {
    assembly { addr := create(callvalue(), add(_code, 32), mload(_code)) }
    emit CreatedContract(addr);
  }
}

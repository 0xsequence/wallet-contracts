// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "../commons/Ownable.sol";


contract ModuleRepository is Ownable {
  event SetModule(bytes32 indexed _key, address indexed _module);

  mapping(bytes32 => address) public moduleFor;

  constructor(address _owner) Ownable(_owner) {}

  function setModule(
    bytes32 _key,
    address _module
  ) external onlyOwner {
    emit SetModule(_key, _module);
    moduleFor[_key] = _module;
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "./ModuleRepository.sol";


contract MainModuleAutoUpdate {
  bytes32 private immutable MODULE_KEY;
  ModuleRepository private immutable REPOSITORY;

  constructor(
    bytes32 _moduleKey,
    ModuleRepository _repository
  ) {
    MODULE_KEY = _moduleKey;
    REPOSITORY = _repository;
  }

  fallback() external payable {
    address module = REPOSITORY.moduleFor(MODULE_KEY);

    assembly {
      calldatacopy(0, 0, calldatasize())
      let result := delegatecall(gas(), module, 0, calldatasize(), 0, 0)
      returndatacopy(0, 0, returndatasize())

      if iszero(result) {
        revert(0, returndatasize())
      }

      return(0, returndatasize())
    }
  }

  receive() external payable { }
}

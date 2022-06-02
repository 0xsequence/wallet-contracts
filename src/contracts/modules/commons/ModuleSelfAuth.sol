// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;


contract ModuleSelfAuth {
  modifier onlySelf() {
    require(msg.sender == address(this), "ModuleSelfAuth#onlySelf: NOT_AUTHORIZED");
    _;
  }
}

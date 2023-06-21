// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


contract ModuleSelfAuth {
  error OnlySelfAuth(address _sender, address _self);

  modifier onlySelf() {
    if (msg.sender != address(this)) {
      revert OnlySelfAuth(msg.sender, address(this));
    }
    _;
  }
}

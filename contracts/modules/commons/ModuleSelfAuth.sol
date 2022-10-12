// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;


contract ModuleSelfAuth {
  error OnlySelfAuth(address _sender, address _self);

  modifier onlySelf() {
    if (!isSelfAuth()) {
      revert OnlySelfAuth(msg.sender, address(this));
    }
    _;
  }

    function isSelfAuth() internal virtual view returns (bool) {
      return msg.sender == address(this);
    }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;
pragma experimental ABIEncoderV2;


contract ModuleOnlyDelegatecall {
  address private immutable self;

  error OnlyDelegatecall();

  constructor() {
    self = address(this);
  }

  modifier onlyDelegatecall() {
    if (address(this) == self) {
      revert OnlyDelegatecall();
    }
    _;
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


contract ModuleOnlyDelegatecall {
  address private immutable self;

  error OnlyDelegatecall();

  constructor() {
    self = address(this);
  }

  /**
   * @notice Modifier that only allows functions to be called via delegatecall.
   */
  modifier onlyDelegatecall() {
    if (address(this) == self) {
      revert OnlyDelegatecall();
    }
    _;
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;


contract ModuleMock {
  event Pong();

  function ping() external {
    emit Pong();
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


contract HookMock {
  function onHookMockCall(uint256 _num) external pure returns (uint256) {
    return _num * 2;
  }
}

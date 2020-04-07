pragma solidity ^0.6.5;


contract HookMock {
  function onHookMockCall(uint256 _num) external pure returns (uint256) {
    return _num * 2;
  }
}

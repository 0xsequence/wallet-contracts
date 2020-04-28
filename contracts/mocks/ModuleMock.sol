pragma solidity ^0.6.6;


contract ModuleMock {
  event Pong();

  function ping() external {
    emit Pong();
  }
}

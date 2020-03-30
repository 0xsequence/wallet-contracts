pragma solidity ^0.6.4;


contract ModuleMock {
  event Pong();

  function ping() external {
    emit Pong();
  }
}

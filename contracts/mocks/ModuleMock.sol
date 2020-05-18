pragma solidity ^0.6.8;


contract ModuleMock {
  event Pong();

  function ping() external {
    emit Pong();
  }
}

pragma solidity ^0.6.7;


contract ModuleMock {
  event Pong();

  function ping() external {
    emit Pong();
  }
}

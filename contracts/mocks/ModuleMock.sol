pragma solidity ^0.6.5;


contract ModuleMock {
  event Pong();

  function ping() external {
    emit Pong();
  }
}

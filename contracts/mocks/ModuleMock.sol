pragma solidity 0.7.6;


contract ModuleMock {
  event Pong();

  function ping() external {
    emit Pong();
  }
}

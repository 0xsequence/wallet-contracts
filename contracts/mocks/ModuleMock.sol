pragma solidity 0.7.4;


contract ModuleMock {
  event Pong();

  function ping() external {
    emit Pong();
  }
}

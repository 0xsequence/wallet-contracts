pragma solidity ^0.5.0;


contract ModuleMock {
    event Pong();

    function ping() external {
        emit Pong();
    }
}

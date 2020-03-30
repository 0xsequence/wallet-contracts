pragma solidity ^0.6.4;


contract Wallet {
    address private implementation;

    constructor(address _implementation) public payable {
        implementation = _implementation;
    }

    fallback() external {
        (bool result, bytes memory data) = implementation.delegatecall(msg.data);
        require(result, string(data));
    }
}

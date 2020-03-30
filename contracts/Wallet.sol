pragma solidity ^0.6.4;


contract Wallet {
    address private fallbackModule;
    mapping(bytes4 => address) private modules;

    constructor(address _fallbackModule) public payable {
        fallbackModule = _fallbackModule;
    }

    fallback() external {
        address target = modules[msg.sig];
        if (target == address(0)) target = fallbackModule;

        (bool result, bytes memory data) = target.delegatecall(msg.data);
        require(result, string(data));
    }
}

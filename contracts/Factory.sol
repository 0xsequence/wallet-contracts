pragma solidity ^0.5.0;

/**
    The factory contract is kept as simple as possible,
    all helper methods should be implemented using helper contracts

    Any ETH sent during deploy is forwarded to the created contract
*/
contract Factory {
    function deploy(bytes memory _code, bytes32 _salt) public payable returns (address _contract) {
        assembly { _contract := create2(callvalue(), add(_code, 32), mload(_code), _salt) }
    }
}

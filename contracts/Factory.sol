pragma solidity ^0.6.4;
import "./Wallet.sol";


contract Factory {
  function deploy(address _mainModule, bytes32 _salt) public payable returns (address _contract) {
    bytes memory code = abi.encodePacked(type(Wallet).creationCode, uint256(_mainModule));
    assembly { _contract := create2(callvalue(), add(code, 32), mload(code), _salt) }
  }

  function addressOf(address _mainModule, bytes32 _salt) external view returns (address) {
    bytes memory code = abi.encodePacked(type(Wallet).creationCode, uint256(_mainModule));

    return address(
      uint256(
        keccak256(
          abi.encodePacked(
            bytes1(0xff),
            address(this),
            _salt,
            keccak256(code)
          )
        )
      )
    );
  }
}

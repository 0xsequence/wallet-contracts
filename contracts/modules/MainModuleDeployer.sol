pragma solidity ^0.6.5;

import "./MainModule.sol";
import "../Wallet.sol";

contract MainModuleDeployer {
  event Deployed(address _module, bytes32 _initCodeHash);

  function deploy(address _factory) external {
    // Calculate address of next deployed contract - keccak256(rlp([sender, nonce]))[12:]
    address dest = address(uint256(keccak256(abi.encodePacked(byte(0xd6), byte(0x94), address(this), byte(0x01)))));

    // Build init code hash of the deployed wallets using that module
    bytes32 initCodeHash = keccak256(abi.encodePacked(Wallet.creationCode, uint256(dest)));

    // Deploy `MainModule.sol`
    address module = address(new MainModule(initCodeHash, _factory));
    emit Deployed(module, initCodeHash);

    // Cleanup
    selfdestruct(msg.sender);
  }
}

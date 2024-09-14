// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

import "./Trust.sol";


contract TrustFactory {
  function trustCreationCode() external pure returns (bytes memory) {
    return type(Trust).creationCode;
  }

  function addressOf(
    address _owner,
    address _beneficiary,
    uint256 _duration
  ) external view returns (address) {
    return address(uint160(uint(keccak256(abi.encodePacked(
      bytes1(0xff),
      address(this),
      bytes32(0),
      keccak256(abi.encodePacked(
        type(Trust).creationCode,
        abi.encode(_owner, _beneficiary, _duration)
      ))
    )))));
  }

  function deploy(
    address _owner,
    address _beneficiary,
    uint256 _duration
  ) external returns (Trust) {
    return new Trust{ salt: bytes32(0) }( _owner, _beneficiary, _duration);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;


contract ContractDetector {
  bytes32 private constant NO_ACCOUNT = 0;

  //                       NO_CODE = keccak256(0x);
  bytes32 private constant NO_CODE = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;

  function isContract(address[] calldata addresses) external view returns (bool[] memory) {
    bool[] memory hasCode = new bool[](addresses.length);

    for (uint256 i = 0; i < addresses.length; i++) {
      address a = addresses[i];
      bytes32 hash;
      assembly { hash := extcodehash(a) }
      hasCode[i] = hash != NO_ACCOUNT && hash != NO_CODE;
    }

    return hasCode;
  }
}

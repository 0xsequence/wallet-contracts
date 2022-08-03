// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "contracts/utils/LibOptim.sol";

import "foundry_test/base/AdvTest.sol";


contract LibOptimTest is AdvTest {
  function test_fkeccak256_Bytes32_Bytes32_Fuzz(bytes32 _a, bytes32 _b) external {
    bytes32 expected = keccak256(abi.encodePacked(_a, _b));
    bytes32 actual = LibOptim.fkeccak256(_a, _b);
    assertEq(expected, actual);
  }
}

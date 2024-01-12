// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "foundry_test/base/AdvTest.sol";

import { HuffConfig } from "foundry-huff/HuffConfig.sol";
import { HuffDeployer } from "foundry-huff/HuffDeployer.sol";

interface L2CompressorImps {
  function testLoadDynamicSize(
    bytes32 _a,
    bytes32 _b,
    uint256 rindex,
    uint256 size
  ) external pure returns (uint256, uint256);
}

contract L2CompressorHuffTests is Test {
  L2CompressorImps public imp;

  function setUp() public {
    imp = L2CompressorImps(
      HuffDeployer
        .config()
        .with_evm_version("paris")
        .deploy("imps/L2CompressorImps")
    );
  }

  function test_load_dynamic_size() external {
    (uint256 size, uint256 rindex) = imp.testLoadDynamicSize(
      bytes32(0x082366f82de6ef3a1d439d0adbfa2ee606f86c2774b4d946f895dfc1f88443a2),
      bytes32(0),
      4,
      1
    );

    assertEq(size, 8);
    assertEq(rindex, 5);

    (size, rindex) = imp.testLoadDynamicSize(
      bytes32(0x082366f82de6ef3a1d439d0adbfa2ee606f86c2774b4d946f895dfc1f88443a2),
      bytes32(0),
      4 + 32 - 3,
      2219024896
    );
  }
}

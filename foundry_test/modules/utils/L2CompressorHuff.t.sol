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

  function testReadBytes32(bytes32 _a, bytes32 _b, uint256 rindex, uint256 windex, uint256 flag) external pure returns (uint256, uint256, bytes32);
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
    uint256 size; uint256 rindex;

    (size, rindex) = imp.testLoadDynamicSize(
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
      4 + 0,
      2
    );

    assertEq(size, 2083);
    assertEq(rindex, 4 + 2);

    (size, rindex) = imp.testLoadDynamicSize(
      bytes32(0x082366f82de6ef3a1d439d0adbfa2ee606f86c2774b4d946f895dfc1f88443a2),
      bytes32(0),
      4 + 2,
      4
    );

    assertEq(size, 1727540710);
    assertEq(rindex, 4 + 4 + 2);
  }

  function test_load_bytes32() external {
    uint256 windex; uint256 rindex; bytes32 value;

    (windex, rindex, value) = imp.testReadBytes32(
      bytes32(0x020166f82de6ef3a1d439d0adbfa2ee606f86c2774b4d946f895dfc1f88443a2),
      bytes32(0),
      4,
      0,
      0x23
    );

    assertEq(windex, 32);
    assertEq(rindex, 4 + 2);
  }
}

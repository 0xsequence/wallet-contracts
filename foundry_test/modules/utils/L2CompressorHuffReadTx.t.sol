// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "foundry_test/base/AdvTest.sol";

import "forge-std/console.sol";
import "forge-std/console2.sol";

import { HuffConfig } from "foundry-huff/HuffConfig.sol";
import { HuffDeployer } from "foundry-huff/HuffDeployer.sol";

uint256 constant FMS = 0xa0;

contract L2CompressorHuffReadTxTests is AdvTest {
  address public imp;

  function setUp() public {
    imp = address(
      HuffDeployer
        .config()
        .with_evm_version("paris")
        .deploy("imps/L2CompressorReadTx")
    );
  }

  function test_read_simple_transaction(bytes32 _data) external {
    (bool s, bytes memory r) = imp.staticcall(
      abi.encodePacked(uint8(0xc0), uint8(0x14), address(0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E))
    );

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    console.logBytes(res);
  }
}

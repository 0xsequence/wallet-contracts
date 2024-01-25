// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "foundry_test/base/AdvTest.sol";

import "forge-std/console.sol";
import "forge-std/console2.sol";

import { HuffConfig } from "foundry-huff/HuffConfig.sol";
import { HuffDeployer } from "foundry-huff/HuffDeployer.sol";

import "contracts/modules/commons/interfaces/IModuleCalls.sol";

uint256 constant FMS = 0xa0;

import "./L2CompressorEncoder.sol";

contract L2CompressorHuffReadNonceTest is AdvTest {
  address public imp;

  function setUp() public {
    imp = address(
      HuffDeployer
        .config()
        .with_evm_version("paris")
        .deploy("imps/L2CompressorReadNonce")
    );
  }

  function test_read_simple_nonce() external {
    uint256 space = 76518466025766696338879503773554426820412884125;
    uint256 nonce = 29095922913147819529123945996;

    bytes32 compact = 0x0d6734e95e00251b768924d47d52db3270fcc49d5e039555a5312d84eb305e0c;

    bytes memory encoded = abi.encodePacked(
      encodeWord(space), encodeWord(nonce)
    );

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    assertEq(compact, abi.decode(res, (bytes32)));
  }

  function test_read_nonce(uint160 _space, uint96 _nonce) external {
    bytes memory encoded = abi.encodePacked(
      encodeWord(_space), encodeWord(_nonce)
    );

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    assertEq(abi.encodePacked(_space, _nonce), res);
  }
}

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

contract L2CompressorHuffReadTxTests is AdvTest {
  address public imp;

  function setUp() public {
    imp = address(
      HuffDeployer
        .config()
        .with_evm_version("paris")
        .deploy("imps/L2CompressorReadTxs")
    );
  }

  function test_read_simple_2_transactions() external {
    address _addr = address(0x1234567890123456789012345678901234567890);
    address _addr2 = address(this);
    bytes memory encoded = abi.encodePacked(
      uint8(0x02),
      build_flag(false, true, false, false, false),
      encode_raw_address(_addr),
      build_flag(true, true, false, false, false),
      encode_raw_address(_addr2)
    );

    (bool s, bytes memory r) = imp.staticcall{ gas: 10000 }(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    IModuleCalls.Transaction[] memory t = new IModuleCalls.Transaction[](2);
    t[0].delegateCall = false;
    t[0].revertOnError = true;
    t[0].target = _addr;
    t[1].delegateCall = true;
    t[1].revertOnError = true;
    t[1].target = _addr2;

    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Abi encode prefixes with the point on which the data starts
    // we don't do it on the compressor, so we need to append 32
    assertEq(abi.encodePacked(abi.encode(32), res), abi.encode(t));
  }

  function test_read_simple_2_transactions_asymetric() external {
    address _addr = address(0x1234567890123456789012345678901234567890);
    address _addr2 = address(this);
    bytes memory _data = hex"123456789012345678901234567890123456789012345678901234567890123456789011222211";

    bytes memory encoded = abi.encodePacked(
      uint8(0x02),
      build_flag(false, true, false, false, true),
      encode_raw_address(_addr),
      encode_bytes_n(_data),
      build_flag(true, true, false, false, false),
      encode_raw_address(_addr2)
    );

    (bool s, bytes memory r) = imp.staticcall{ gas: 10000 }(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    IModuleCalls.Transaction[] memory t = new IModuleCalls.Transaction[](2);
    t[0].delegateCall = false;
    t[0].revertOnError = true;
    t[0].target = _addr;
    t[0].data = _data;
    t[1].delegateCall = true;
    t[1].revertOnError = true;
    t[1].target = _addr2;

    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Abi encode prefixes with the point on which the data starts
    // we don't do it on the compressor, so we need to append 32
    assertEq(abi.encodePacked(abi.encode(32), res), abi.encode(t));
  }

  function test_read_transactions(IModuleCalls.Transaction[] memory _txs) external {
    vm.assume(_txs.length != 0 && _txs.length <= type(uint8).max);

    bytes memory encoded = abi.encodePacked(
      uint8(_txs.length)
    );

    for (uint256 i = 0; i < _txs.length; i++) {
      IModuleCalls.Transaction memory t = _txs[i];

      encoded = abi.encodePacked(
        encoded,
        build_flag(t.delegateCall, t.revertOnError, t.gasLimit != 0, t.value != 0, t.data.length != 0),
        t.gasLimit != 0 ? encodeWord(t.gasLimit) : bytes(""),
        encode_raw_address(t.target),
        t.value != 0 ? encodeWord(t.value) : bytes(""),
        t.data.length != 0 ? encode_bytes_n(t.data) : bytes("")
      );
    }

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Abi encode prefixes with the point on which the data starts
    // we don't do it on the compressor, so we need to append 32
    assertEq(abi.encodePacked(abi.encode(32), res), abi.encode(_txs));
  }
}

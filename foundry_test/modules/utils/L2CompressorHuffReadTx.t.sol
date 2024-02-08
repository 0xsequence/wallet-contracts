// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "foundry_test/base/AdvTest.sol";

import "forge-std/console.sol";
import "forge-std/console2.sol";

import { HuffConfig } from "foundry-huff/HuffConfig.sol";
import { HuffDeployer } from "foundry-huff/HuffDeployer.sol";

import "contracts/modules/commons/interfaces/IModuleCalls.sol";

import "./L2CompressorEncoder.sol";

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

  function test_read_simple_transaction(address _addr) external {
    bytes memory encoded = abi.encodePacked(build_flag(true, true, false, false, false), encode_raw_address(_addr));

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    IModuleCalls.Transaction memory t;
    t.delegateCall = true;
    t.revertOnError = true;
    t.target = _addr;

    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Abi encode prefixes with the point on which the data starts
    // we don't do it on the compressor, so we need to append 32
    assertEq(abi.encodePacked(abi.encode(32), res), abi.encode(t));
  }

  function test_read_simple_transaction_with_data(address _addr, bytes memory _data) external {
    bytes memory encoded = abi.encodePacked(
      build_flag(true, true, false, false, true),
      encode_raw_address(_addr),
      encode_bytes_n(_data)
    );

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    IModuleCalls.Transaction memory t;
    t.delegateCall = true;
    t.revertOnError = true;
    t.target = _addr;
    t.data = _data;

    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Abi encode prefixes with the point on which the data starts
    // we don't do it on the compressor, so we need to append 32
    assertEq(abi.encodePacked(abi.encode(32), res), abi.encode(t));
  }

  function test_read_transaction(IModuleCalls.Transaction memory _tx) external {
    bytes memory encoded = abi.encodePacked(
      build_flag(_tx.delegateCall, _tx.revertOnError, _tx.gasLimit != 0, _tx.value != 0, _tx.data.length != 0),
      _tx.gasLimit != 0 ? encodeWord(_tx.gasLimit) : bytes(""),
      encode_raw_address(_tx.target),
      _tx.value != 0 ? encodeWord(_tx.value) : bytes(""),
      _tx.data.length != 0 ? encode_bytes_n(_tx.data) : bytes("")
    );

    console.logBytes(encoded);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Abi encode prefixes with the point on which the data starts
    // we don't do it on the compressor, so we need to append 32
    assertEq(abi.encodePacked(abi.encode(32), res), abi.encode(_tx));
  }
}

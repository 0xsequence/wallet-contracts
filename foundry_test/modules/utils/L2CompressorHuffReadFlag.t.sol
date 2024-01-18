// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "foundry_test/base/AdvTest.sol";

import "forge-std/console.sol";
import "forge-std/console2.sol";

import { HuffConfig } from "foundry-huff/HuffConfig.sol";
import { HuffDeployer } from "foundry-huff/HuffDeployer.sol";

uint256 constant FMS = 0xa0;

contract L2CompressorHuffReadFlagTests is AdvTest {
  address public imp;

  function setUp() public {
    imp = address(
      HuffDeployer
        .config()
        .with_evm_version("paris")
        .deploy("imps/L2CompressorReadFlag")
    );
  }

  function test_read_flag_bytes32_zero(bytes32 _data) external {
    (bool s, bytes memory r) = imp.staticcall(
      abi.encodePacked(hex"00", _data)
    );

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 1);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(uint256(0)), res);
  }

  function test_read_flag_bytes32_one(uint8 _val) external {
    (bool s, bytes memory r) = imp.staticcall(
      abi.encodePacked(hex"01", _val)
    );

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 2);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(uint256(_val)), res);
  }

  function test_read_flag_bytes32_two(uint16 _val) external {
    (bool s, bytes memory r) = imp.staticcall(
      abi.encodePacked(hex"02", _val)
    );

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 3);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(uint256(_val)), res);
  }

  function test_read_flag_bytes32_x(uint256 _size, bytes memory _content) public {
    _size = bound(_size, 0, 32);
  
    (bool s, bytes memory r) = imp.staticcall(
      abi.encodePacked(uint8(_size), _content)
    );

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 1 + _size);
    assertEq(windex, FMS + 32);

    _content = abi.encodePacked(_content, bytes32(0));
    uint256 expected;
    assembly {
      expected := mload(add(_content, 0x20))
      expected := shr(sub(256, mul(_size, 8)), expected)
    }

    assertEq(abi.encode(uint256(expected)), res);
  }

  function test_read_flag_save_and_read_address(address _addr2) external {
    address _addr = address(this);
    (bool s, bytes memory r) = imp.call(
      abi.encodePacked(hex"21", _addr)
    );

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, 1 + 20);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_addr), res);

    // Read the address at index 1
    (s, r) = imp.staticcall(
      abi.encodePacked(hex"23", uint16(1))
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 3);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_addr), res);

    // Save a second address
    (s, r) = imp.call(
      abi.encodePacked(hex"21", _addr2)
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, 1 + 20);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_addr2), res);

    // Read second address using 3 bytes, 4 bytes and 5 bytes
    (s, r) = imp.staticcall(
      abi.encodePacked(hex"24", uint24(2))
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 4);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_addr2), res);

    (s, r) = imp.staticcall(
      abi.encodePacked(hex"25", uint32(2))
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 5);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_addr2), res);

    (s, r) = imp.staticcall(
      abi.encodePacked(hex"26", uint40(2))
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 6);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_addr2), res);
  }

  function test_read_flag_save_and_read_bytes32(bytes32 _b1, bytes32 _b2) external {
    (bool s, bytes memory r) = imp.call(
      abi.encodePacked(hex"22", _b1)
    );

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, 1 + 32);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_b1), res);

    // Read the address at index 1
    (s, r) = imp.staticcall(
      abi.encodePacked(hex"27", uint16(1))
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 3);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_b1), res);

    // Save a second address
    (s, r) = imp.call(
      abi.encodePacked(hex"22", _b2)
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, 1 + 32);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_b2), res);

    // Read second address using 3 bytes, 4 bytes and 5 bytes
    (s, r) = imp.staticcall(
      abi.encodePacked(hex"28", uint24(2))
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 4);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_b2), res);

    (s, r) = imp.staticcall(
      abi.encodePacked(hex"29", uint32(2))
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 5);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_b2), res);

    (s, r) = imp.staticcall(
      abi.encodePacked(hex"2a", uint40(2))
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 6);
    assertEq(windex, FMS + 32);

    assertEq(abi.encode(_b2), res);
  }

  function test_read_flag_bytes_n(bytes calldata _data, bytes calldata _extra) external {
    (bool s, bytes memory r) = imp.staticcall(
      abi.encodePacked(hex"2b", hex"04", uint32(_data.length), _data, _extra)
    );

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, _data.length + 1 + 1 + 4);
    assertEq(windex, FMS + _data.length);
    assertEq(res, _data);
  }

  function test_read_flag_abi_encode_1() external {
    bytes4 selector = 0x9988aabb;
    uint256 val = type(uint64).max;

    (bool s, bytes memory r) = imp.staticcall(
      abi.encodePacked(hex"2e", selector, hex"08", uint64(val))
    );

    assertTrue(s);
    console.logBytes(r);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));
    console.logBytes(res);
  }
}

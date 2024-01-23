// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "foundry_test/base/AdvTest.sol";

import "forge-std/console.sol";
import "forge-std/console2.sol";

import { HuffConfig } from "foundry-huff/HuffConfig.sol";
import { HuffDeployer } from "foundry-huff/HuffDeployer.sol";

import "./L2CompressorEncoder.sol";

uint256 constant FMS = 0xc0;

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

  function test_read_flag_abi_encode_0(bytes4 _selector) external {
    bytes memory encoded = encode_abi_call(_selector);
    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(abi.encodePacked(_selector), res);
  }

  function test_read_flag_abi_encode_1(bytes4 _selector, bytes32 _v1) external {
    bytes memory encoded = encode_abi_call(_selector, _v1);
    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(abi.encodePacked(_selector, _v1), res);
  }

  function test_read_flag_abi_encode_2(bytes4 _selector, bytes32 _v1, bytes32 _v2) external {
    bytes memory encoded = encode_abi_call(_selector, _v1, _v2);
    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(abi.encodePacked(_selector, _v1, _v2), res);
  }

  function test_read_flag_abi_encode_3(bytes4 _selector, bytes32 _v1, bytes32 _v2, bytes32 _v3) external {
    bytes memory encoded = encode_abi_call(_selector, _v1, _v2, _v3);
    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(abi.encodePacked(_selector, _v1, _v2, _v3), res);
  }

  function test_read_flag_abi_encode_4(
    bytes4 _selector,
    bytes32 _v1,
    bytes32 _v2,
    bytes32 _v3,
    bytes32 _v4
  ) external {
    bytes memory encoded = encode_abi_call(_selector, _v1, _v2, _v3, _v4);
    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(abi.encodePacked(_selector, _v1, _v2, _v3, _v4), res);
  }

  function test_read_flag_abi_encode_5(
    bytes4 _selector,
    bytes32 _v1,
    bytes32 _v2,
    bytes32 _v3,
    bytes32 _v4,
    bytes32 _v5
  ) external {
    bytes memory encoded = encode_abi_call(_selector, _v1, _v2, _v3, _v4, _v5);
    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(abi.encodePacked(_selector, _v1, _v2, _v3, _v4, _v5), res);
  }

  function test_read_flag_abi_encode_5(
    bytes4 _selector,
    bytes32 _v1,
    bytes32 _v2,
    bytes32 _v3,
    bytes32 _v4,
    bytes32 _v5,
    bytes32 _v6
  ) external {
    bytes memory encoded = encode_abi_call(_selector, _v1, _v2, _v3, _v4, _v5, _v6);
    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(abi.encodePacked(_selector, _v1, _v2, _v3, _v4, _v5, _v6), res);
  }

  function test_read_nested(bytes memory _dynamic, uint256 _val1, uint256 _val2) external {
    bytes memory encoded = encode_nested(
      encode_bytes_n(_dynamic),
      encode_nested(
        encodeWord(_val1),
        encodeWord(_val2)
      )
    );

    (bool s, bytes memory r) = imp.staticcall(encoded);
    assertEq(s, true);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(abi.encodePacked(_dynamic, _val1, _val2), res);
  }

  function test_read_encode_nested_long() external {
    bytes[] memory vals = new bytes[](2000);

    for (uint256 i = 0; i < vals.length; i++) {
      vals[i] = encodeWord(i * 2);
    }

    bytes memory encoded = encode_nested(vals);

    (bool s, bytes memory r) = imp.staticcall(encoded);
    assertEq(s, true);

    bytes memory expected;
    for (uint256 i = 0; i < vals.length; i++) {
      expected = abi.encodePacked(expected, uint256(i * 2));
    }

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(expected, res);
  }

  function test_read_signature(uint8 _weight, bytes1[66] memory _sig) external {
    bytes memory _sig2 = new bytes(66);

    for (uint256 i = 0; i < _sig.length; i++) {
      _sig2[i] = _sig[i];
    }

    bytes memory encoded = encode_eoa_signature(_weight, _sig2);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);

    assertEq(res, abi.encodePacked(uint8(0), _weight, _sig2));
  }

  function test_read_address(uint8 _weight, address _addr) external {
    bytes memory encoded = encode_address(_weight, _addr);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);

    assertEq(res, abi.encodePacked(uint8(1), _weight, _addr));
  }

  function test_read_node(bytes32 _node) external {
    bytes memory encoded = encode_node(_node);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);

    assertEq(res, abi.encodePacked(uint8(3), _node));
  }

  function test_read_subdigest(bytes32 _subdigest) external {
    bytes memory encoded = encode_subdigest(_subdigest);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);

    assertEq(res, abi.encodePacked(uint8(5), _subdigest));
  }

  function test_read_branch(bytes memory _data) external {
    vm.assume(_data.length <= type(uint24).max);

    bytes memory encoded = encode_branch(_data);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);

    assertEq(res, abi.encodePacked(uint8(4), uint24(_data.length), _data));
  }

  function test_read_nested(uint8 _weight, uint8 _threshold, bytes memory _data) external {
    vm.assume(_data.length <= type(uint24).max);

    bytes memory encoded = encode_nested(_weight, _threshold, _data);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);

    assertEq(res, abi.encodePacked(uint8(6), uint8(_weight), uint16(_threshold), uint24(_data.length), _data));
  }
}

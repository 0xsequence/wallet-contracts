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
    _size = bound(_size, 1, 32);
  
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
      abi.encodePacked(hex"25", uint32(2))
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 5);
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
      abi.encodePacked(hex"29", uint32(2))
    );

    assertTrue(s);
    (rindex, windex, res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 5);
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

  function test_read_dynamic_signature(uint8 _weight, address _signer, bytes memory _signature) external {
    vm.assume(_signature.length <= type(uint24).max - 1);

    bytes memory encoded = encode_dynamic_signature(_weight, _signer, _signature);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);

    assertEq(res, abi.encodePacked(uint8(2), uint8(_weight), _signer, uint24(_signature.length + 1), _signature, uint8(3)));
  }

  function test_read_sequence_signature(bool _noChainId, uint16 _threshold, uint32 _checkpoint, bytes memory _tree) external {
    bytes memory encoded = encode_sequence_signature(_noChainId, _threshold, _checkpoint, _tree);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);

    assertEq(res, abi.encodePacked(uint8(_noChainId ? 0x02 : 0x01), uint16(_threshold), uint32(_checkpoint), _tree));
  }

  function test_read_sequence_chained_signatures(bytes[] memory _signatures) external {
    vm.assume(_signatures.length != 0);
    for (uint256 i = 0; i < _signatures.length; i++) {
      vm.assume(_signatures[i].length <= type(uint24).max);
    }

    bytes memory encoded = encode_sequence_chained_signatures(_signatures);

    (bool s, bytes memory r) = imp.staticcall(encoded);
    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);

    bytes memory expected = abi.encodePacked(uint8(0x03));

    for (uint256 i = 0; i < _signatures.length; i++) {
      expected = abi.encodePacked(expected, uint24(_signatures[i].length), _signatures[i]);
    }

    assertEq(res, expected);
  }

  function test_read_abi_dynamic_no_dynamic(
    bytes4 _selector,
    bytes32[] calldata _values
  ) external {
    vm.assume(_values.length <= type(uint8).max && _values.length != 0);
    bool[] memory isDynamic = new bool[](_values.length);
    bytes[] memory values = new bytes[](_values.length);
    for (uint256 i = 0; i < _values.length; i++) {
      values[i] = abi.encodePacked(_values[i]);
    }

    bytes memory encoded = encode_abi_dynamic(_selector, isDynamic, values);

    (bool s, bytes memory r) = imp.staticcall(encoded);
    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);

    assertEq(res, abi.encodePacked(_selector, _values));
  }

  function test_read_abi_dynamic_only_1(
    bytes4 _selector,
    bytes memory _data1
  ) external {
    bool[] memory isDynamic = new bool[](1);
    bytes[] memory _values = new bytes[](1);

    isDynamic[0] = true;

    _values[0] = _data1;

    bytes memory encoded = encode_abi_dynamic(_selector, isDynamic, _values);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);

    assertEq(res, abi.encodeWithSelector(_selector, _values[0]));
  }

  function test_read_abi_dynamic_only_2(
    bytes4 _selector,
    bytes memory _data1,
    bytes memory _data2
  ) external {
    bool[] memory isDynamic = new bool[](2);
    bytes[] memory _values = new bytes[](2);

    isDynamic[0] = true;
    isDynamic[1] = true;

    _values[0] = _data1;
    _values[1] = _data2;

    bytes memory encoded = encode_abi_dynamic(_selector, isDynamic, _values);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);

    assertEq(res, abi.encodeWithSelector(_selector, _values[0], _values[1]));
  }

  function test_read_abi_dynamic_only_3(
    bytes4 _selector,
    bytes memory _data1,
    bytes memory _data2,
    bytes memory _data3
  ) external {
    bool[] memory isDynamic = new bool[](3);
    bytes[] memory _values = new bytes[](3);

    isDynamic[0] = true;
    isDynamic[1] = true;
    isDynamic[2] = true;

    _values[0] = _data1;
    _values[1] = _data2;
    _values[2] = _data3;

    bytes memory encoded = encode_abi_dynamic(_selector, isDynamic, _values);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);

    assertEq(res, abi.encodeWithSelector(_selector, _values[0], _values[1], _values[2]));
  }

  function test_read_abi_dynamic_only_8(
    bytes4 _selector,
    bytes memory _data1,
    bytes memory _data2,
    bytes memory _data3,
    bytes memory _data4,
    bytes memory _data5,
    bytes memory _data6,
    bytes memory _data7,
    bytes memory _data8
  ) external {
    bytes memory r; uint256 el;

    {
      bool[] memory isDynamic = new bool[](8);
      bytes[] memory _values = new bytes[](8);

      isDynamic[0] = true;
      isDynamic[1] = true;
      isDynamic[2] = true;
      isDynamic[3] = true;
      isDynamic[4] = true;
      isDynamic[5] = true;
      isDynamic[6] = true;
      isDynamic[7] = true;

      _values[0] = _data1;
      _values[1] = _data2;
      _values[2] = _data3;
      _values[3] = _data4;
      _values[4] = _data5;
      _values[5] = _data6;
      _values[6] = _data7;
      _values[7] = _data8;

      bool s;
      bytes memory encoded = encode_abi_dynamic(_selector, isDynamic, _values);

      (s, r) = imp.staticcall(encoded);
      el = encoded.length;
      assertTrue(s);
    }


    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, el);

    assertEq(res, abi.encodeWithSelector(
        _selector,
        _data1,
        _data2,
        _data3,
        _data4,
        _data5,
        _data6,
        _data7,
        _data8
      )
    );
  }

  function test_read_mixed_2(
    bytes4 _selector,
    bytes32 _data1,
    bytes memory _data2
  ) external {
    bool[] memory isDynamic = new bool[](2);
    bytes[] memory _values = new bytes[](2);

    isDynamic[0] = false;
    isDynamic[1] = true;

    _values[0] = abi.encodePacked(_data1);
    _values[1] = _data2;

    bytes memory encoded = encode_abi_dynamic(_selector, isDynamic, _values);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    bytes memory expected = abi.encodeWithSelector(_selector, _data1, _data2);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);

    assertEq(res, expected);
  }

  function test_read_mixed_2b(
    bytes4 _selector,
    bytes memory _data1,
    bytes32 _data2
  ) external {
    bool[] memory isDynamic = new bool[](2);
    bytes[] memory _values = new bytes[](2);

    isDynamic[0] = true;
    isDynamic[1] = false;

    _values[0] = _data1;
    _values[1] = abi.encodePacked(_data2);

    bytes memory encoded = encode_abi_dynamic(_selector, isDynamic, _values);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    bytes memory expected = abi.encodeWithSelector(_selector, _data1, _data2);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);

    assertEq(res, expected);
  }

  function test_read_abi_mixed_8b(
    bytes4 _selector,
    bytes32 _data1,
    bytes memory _data2,
    bytes32 _data3,
    bytes memory _data4,
    bytes memory _data5,
    bytes memory _data6,
    bytes32 _data7,
    bytes32 _data8
  ) external {
    bytes memory r; uint256 el;

    {
      bool[] memory isDynamic = new bool[](8);
      bytes[] memory _values = new bytes[](8);

      isDynamic[0] = false;
      isDynamic[1] = true;
      isDynamic[2] = false;
      isDynamic[3] = true;
      isDynamic[4] = true;
      isDynamic[5] = true;
      isDynamic[6] = false;
      isDynamic[7] = false;

      _values[0] = abi.encodePacked(_data1);
      _values[1] = _data2;
      _values[2] = abi.encodePacked(_data3);
      _values[3] = _data4;
      _values[4] = _data5;
      _values[5] = _data6;
      _values[6] = abi.encodePacked(_data7);
      _values[7] = abi.encodePacked(_data8);

      bool s;
      bytes memory encoded = encode_abi_dynamic(_selector, isDynamic, _values);

      (s, r) = imp.staticcall(encoded);
      el = encoded.length;
      assertTrue(s);
    }


    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, el);

    assertEq(res, abi.encodeWithSelector(
        _selector,
        _data1,
        _data2,
        _data3,
        _data4,
        _data5,
        _data6,
        _data7,
        _data8
      )
    );
  }

  function test_read_abi_mixed_8b(
    bytes4 _selector,
    bytes memory _data1,
    bytes32 _data2,
    bytes32 _data3,
    bytes memory _data4,
    bytes memory _data5,
    bytes32 _data6,
    bytes memory _data7,
    bytes memory _data8
  ) external {
    bytes memory r; uint256 el;

    {
      bool[] memory isDynamic = new bool[](8);
      bytes[] memory _values = new bytes[](8);

      isDynamic[0] = true;
      isDynamic[1] = false;
      isDynamic[2] = false;
      isDynamic[3] = true;
      isDynamic[4] = true;
      isDynamic[5] = false;
      isDynamic[6] = true;
      isDynamic[7] = true;

      _values[0] = _data1;
      _values[1] = abi.encodePacked(_data2);
      _values[2] = abi.encodePacked(_data3);
      _values[3] = _data4;
      _values[4] = _data5;
      _values[5] = abi.encodePacked(_data6);
      _values[6] = _data7;
      _values[7] = _data8;

      bool s;
      bytes memory encoded = encode_abi_dynamic(_selector, isDynamic, _values);

      (s, r) = imp.staticcall(encoded);
      el = encoded.length;
      assertTrue(s);
    }


    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, el);

    assertEq(res, abi.encodeWithSelector(
        _selector,
        _data1,
        _data2,
        _data3,
        _data4,
        _data5,
        _data6,
        _data7,
        _data8
      )
    );
  }

  function test_read_no_op() external {
    bytes memory encoded = abi.encodePacked(uint8(0x4c));

    (bool s, bytes memory r) = imp.staticcall(encoded);
    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, 1);
    assertEq(windex, FMS + res.length);
    assertEq(res.length, 0);
  }

  function test_mirror_flag() external {
    bytes memory encoded = abi.encodePacked(
      encode_nested(
        encodeWord(type(uint256).max - 1),
        abi.encodePacked(uint8(0x4d), uint16(0x02))
      )
    );

    (bool s, bytes memory r) = imp.staticcall(encoded);
    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);
    assertEq(res, abi.encodePacked(type(uint256).max - 1, type(uint256).max - 1));
  }

  function test_copy_calldata() external {
    bytes memory encoded = abi.encodePacked(
      encode_nested(
        encodeWord(type(uint256).max - 1),
        abi.encodePacked(uint8(0x4e), uint16(0x03), uint8(0x21))
      )
    );

    (bool s, bytes memory r) = imp.staticcall(encoded);
    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);
    assertEq(res, abi.encodePacked(type(uint256).max - 1, type(uint256).max - 1, uint8(0x4e)));
  }

  function test_read_storage_flag_addr(address _addr) external {
    _addr = address(this);
    bytes memory encoded = abi.encodePacked(
      encode_nested(
        abi.encodePacked(uint8(0x21), _addr),
        abi.encodePacked(uint8(0x4f), uint16(0x02))
      )
    );

    (bool s, bytes memory r) = imp.call(encoded);
    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);
    assertEq(res, abi.encode(_addr, _addr));
  }

  function test_read_literal(uint256 _val) external {
    bytes memory encoded = encodeWord(_val);

    (bool s, bytes memory r) = imp.call(encoded);
    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);
    assertEq(res, abi.encode(_val));
  }

  function test_read_pow_10(uint256 _exp) external {
    _exp = bound(_exp, 0, 77);

    // First bit means we aren't going to multiply it after
    bytes memory encoded = abi.encodePacked(uint8(0x00), uint8(_exp) | uint8(0x80));

    (bool s, bytes memory r) = imp.call(encoded);
    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(windex, FMS + res.length);
    assertEq(rindex, encoded.length);
    assertEq(res, abi.encode(uint256(10 ** _exp)));
  }

  function test_read_pow_10_and_mul(uint256 _exp, uint8 _mantissa) external {
    _exp = bound(_exp, 1, 77);

    // First bit means we aren't going to multiply it after
    bytes memory encoded = abi.encodePacked(uint8(0x00), uint8(_exp), uint8(_mantissa));

    (bool s, bytes memory r) = imp.call(encoded);
    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    unchecked {
      assertEq(windex, FMS + res.length);
      assertEq(rindex, encoded.length);
      assertEq(res, abi.encode(uint256(10 ** _exp) * uint256(_mantissa)));
    }
  }

  function test_read_pow_10_and_mul_l(uint256 _exp, uint256 _mantissa) external {
    _exp = bound(_exp, 0, 63);
    _mantissa = bound(_mantissa, 0, 0x3ffff);

    // Encode the 3 byte word, the first 3 bits are the exponent, the rest is the mantissa
    bytes3 word = bytes3(uint24(_exp) << 18 | uint24(_mantissa));

    // First bit means we aren't going to multiply it after
    bytes memory encoded = abi.encodePacked(uint8(0x2a), word);

    (bool s, bytes memory r) = imp.call(encoded);
    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    uint256 expected;
    unchecked {
      expected = uint256(10 ** _exp) * uint256(_mantissa);
    }

    unchecked {
      assertEq(windex, FMS + res.length);
      assertEq(rindex, encoded.length);
      assertEq(res, abi.encode(expected));
    }
  }

  function test_read_self_execute() external {
    // vm.assume(_txs.length != 0 && _txs.length <= type(uint8).max);

    IModuleCalls.Transaction[] memory _txs = new IModuleCalls.Transaction[](1);

    bytes memory encoded = abi.encodePacked(
      uint8(0x00), uint8(0x00),
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

    bytes memory solidityEncoded = abi.encodeWithSelector(IModuleCalls.selfExecute.selector, _txs);
    assertEq(solidityEncoded, res);
  }

  function test_read_flag_abi_encode_by_index() external {
    bytes memory encoded = abi.encodePacked(uint8(0x2d), uint8(0x01));
    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(hex"a9059cbb", res);
  }

  function test_read_flag_abi_encode_by_index_2() external {
    bytes memory encoded = abi.encodePacked(uint8(0x2d), uint8(0x02));
    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(hex"095ea7b3", res);
  }

  function test_read_flag_abi_encode_by_index_2_args(bytes32 _arg) external {
    bytes memory encoded = abi.encodePacked(uint8(0x2e), uint8(0x01), encodeWord(_arg));
    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);

    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, FMS + res.length);
    assertEq(abi.encodePacked(hex"a9059cbb", _arg), res);
  }
}

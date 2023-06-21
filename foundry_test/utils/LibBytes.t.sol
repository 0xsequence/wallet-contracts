// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/utils/LibBytes.sol";

import "foundry_test/base/AdvTest.sol";


contract LibBytesImp {
  using LibBytes for bytes;

  function readBytes32(bytes calldata _data, uint256 _index) external pure returns (bytes32) {
    return _data.readBytes32(_index);
  }

  function readUint8(bytes calldata _data, uint256 _index) external pure returns (uint8) {
    return _data.readUint8(_index);
  }

  function readFirstUint16(bytes calldata _data) external pure returns (uint16) {
    return _data.readFirstUint16();
  }

  function readUint32(bytes calldata _data, uint256 _index) external pure returns (uint32) {
    return _data.readUint32(_index);
  }
}

contract LibBytesTest is AdvTest {
  LibBytesImp private lib;

  function setUp() external {
    lib = new LibBytesImp();
  }

  function test_readBytes32(bytes calldata _prefix, bytes32 _data, bytes calldata _sufix) external {
    bytes memory combined = abi.encodePacked(_prefix, _data, _sufix);
    bytes32 actual = lib.readBytes32(combined, _prefix.length);
    assertEq(actual, _data);
  }

  function test_readBytes32_OutOfBounds(bytes calldata _data, uint256 _index) external view {
    lib.readBytes32(_data, _index);
  }

  function test_readBytes32_Fuzz_AbiDecode(bytes calldata _data, uint256 _index) external {
    _index = bound(_index, 0, _data.length > 32 ? _data.length - 32 : 0);
    bytes32 expected = abi.decode(abi.encodePacked(_data[_index:], bytes32(0)), (bytes32));
    bytes32 actual = lib.readBytes32(_data, _index);
    assertEq(expected, actual);
  }

  function test_readUint8(bytes calldata _prefix, uint8 _data, bytes calldata _sufix) external {
    bytes memory combined = abi.encodePacked(_prefix, _data, _sufix);
    uint8 expected = lib.readUint8(combined, _prefix.length);
    assertEq(expected, _data);
  }

  function test_readUint8_OutOfBounds(bytes calldata _data, uint256 _index) external view {
    lib.readUint8(_data, _index);
  }

  function test_readUint8_Fuzz_ReadByte(bytes calldata _data, uint256 _index) external {
    vm.assume(_data.length >= 1);

    _index = bound(_index, 0, _data.length - 1);
    uint8 expected = uint8(uint256(bytes32(_data[_index])) >> 248);
    uint8 actual = lib.readUint8(_data, _index);

    assertEq(expected, actual);
  }

  function test_readFirstUint16(uint16 _data, bytes calldata _sufix) external {
    bytes memory combined = abi.encodePacked(_data, _sufix);
    uint16 expected = lib.readFirstUint16(combined);
    assertEq(expected, _data);
  }

  function test_readFirstUint16_OutOfBounds(uint8 _data) external {
    bytes memory encoded = abi.encodePacked(_data);

    uint16 actual = lib.readFirstUint16(bytes(''));
    assertEq(actual, uint16(0));

    actual = lib.readFirstUint16(encoded);
    assertEq(actual, uint256(_data) << 8);
  }

  function test_readFirstUint16_Fuzz_AbiDecode(bytes calldata _data) external {
    uint256 expected = abi.decode(abi.encodePacked(_data, bytes32(0)), (uint256));
    uint16 actual = lib.readFirstUint16(_data);

    assertEq(expected >> 240, actual);
  }

  function test_readUint32(bytes calldata _prefix, uint32 _data, bytes calldata _sufix) external {
    bytes memory combined = abi.encodePacked(_prefix, _data, _sufix);
    uint32 expected = lib.readUint32(combined, _prefix.length);
    assertEq(expected, _data);
  }
}

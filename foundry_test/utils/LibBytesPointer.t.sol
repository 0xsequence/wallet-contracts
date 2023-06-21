// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/utils/LibBytes.sol";
import "contracts/utils/LibBytesPointer.sol";

import "foundry_test/base/AdvTest.sol";


contract LibBytesPointerImp {
  using LibBytesPointer for bytes;

  function readFirstUint16(bytes calldata _data) external pure returns (uint16, uint256) {
    return _data.readFirstUint16();
  }

  function readUint8(bytes calldata _data, uint256 _index) external pure returns (uint8, uint256) {
    return _data.readUint8(_index);
  }

  function readUint8Address(bytes calldata _data, uint256 _index) external pure returns (uint8, address, uint256) {
    return _data.readUint8Address(_index);
  }

  function readUint16(bytes calldata _data, uint256 _index) external pure returns (uint16, uint256) {
    return _data.readUint16(_index);
  }

  function readUint24(bytes calldata _data, uint256 _index) external pure returns (uint24, uint256) {
    return _data.readUint24(_index);
  }

  function readUint64(bytes calldata _data, uint256 _index) external pure returns (uint64, uint256) {
    return _data.readUint64(_index);
  }

  function readBytes32(bytes calldata _data, uint256 _index) external pure returns (bytes32, uint256) {
    return _data.readBytes32(_index);
  }
}

contract LibBytesPointerTest is AdvTest {
  using LibBytes for bytes;

  LibBytesPointerImp private lib;

  function setUp() public {
    lib = new LibBytesPointerImp();
  }

  function test_readFirstUint16_Fuzz_LibBytes(bytes calldata _data) external {
    uint16 expected = _data.readFirstUint16();
    (uint16 actual, uint256 index) = lib.readFirstUint16(_data);
    assertEq(actual, expected);
    assertEq(index, 2);
  }

  function test_readUint8_Fuzz_LibBytes(bytes calldata _data, uint256 _pointer) external {
    uint8 expected = _data.readUint8(_pointer);
    (uint8 actual, uint256 newPointer) = lib.readUint8(_data, _pointer);
    assertEq(actual, expected);
    unchecked { assertEq(newPointer, _pointer + 1); }
  }

  function test_readUint8Address(bytes calldata _prefix, uint8 _data1, address _data2, bytes calldata _sufix) external {
    bytes memory combined = abi.encodePacked(_prefix, _data1, _data2, _sufix);
    (uint8 actual1, address actual2, uint256 newPointer) = lib.readUint8Address(combined, _prefix.length);
    assertEq(actual1, _data1);
    assertEq(actual2, _data2);
    assertEq(newPointer, _prefix.length + 21);
  }

  function test_readUint8Address_OutOfBounds(bytes calldata _data, uint256 _pointer) external {
    (,, uint256 newPointer) = lib.readUint8Address(_data, _pointer);
    unchecked { assertEq(newPointer, _pointer + 21); }
  }

  function test_readUint16_Fuzz_ReadFirstUint16(bytes calldata _data, uint256 _pointer) external {
    vm.assume(_data.length >= 16);

    _pointer = bound(_pointer, 0, _data.length - 16);
    (uint16 expected,) = lib.readFirstUint16(_data[_pointer:]);
    (uint16 actual, uint256 newPointer) = lib.readUint16(_data, _pointer);
    assertEq(actual, expected);
    unchecked { assertEq(newPointer, _pointer + 2); }
  }

  function test_readUint16_OutOfBounds(bytes calldata _data, uint256 _pointer) external {
    (, uint256 newPointer) = lib.readUint16(_data, _pointer);
    unchecked { assertEq(newPointer, _pointer + 2); }
  }

  function test_readUint24(bytes calldata _prefix, uint24 _data, bytes calldata _sufix) external {
    bytes memory combined = abi.encodePacked(_prefix, _data, _sufix);
    (uint256 actual, uint256 newPointer) = lib.readUint24(combined, _prefix.length);
    assertEq(actual, _data);
    assertEq(newPointer, _prefix.length + 3);
  }

  function test_readUint24_OutOfBounds(bytes calldata _data, uint256 _pointer) external {
    (, uint256 newPointer) = lib.readUint24(_data, _pointer);
    unchecked { assertEq(newPointer, _pointer + 3); }
  }

  function test_readUint64(bytes calldata _prefix, uint64 _data, bytes calldata _sufix) external {
    bytes memory combined = abi.encodePacked(_prefix, _data, _sufix);
    (uint64 actual, uint256 newPointer) = lib.readUint64(combined, _prefix.length);
    assertEq(actual, _data);
    assertEq(newPointer, _prefix.length + 8);
  }

  function test_readUint64_OutOfBounds(bytes calldata _data, uint256 _pointer) external {
    (, uint256 newPointer) = lib.readUint64(_data, _pointer);
    unchecked { assertEq(newPointer, _pointer + 8); }
  }

  function test_readBytes32(bytes calldata _prefix, bytes32 _data, bytes calldata _sufix) external {
    bytes memory combined = abi.encodePacked(_prefix, _data, _sufix);
    (bytes32 actual, uint256 newPointer) = lib.readBytes32(combined, _prefix.length);
    assertEq(actual, _data);
    assertEq(newPointer, _prefix.length + 32);
  }

  function test_readBytes32_OutOfBounds(bytes calldata _data, uint256 _pointer) external {
    (, uint256 newPointer) = lib.readBytes32(_data, _pointer);
    unchecked { assertEq(newPointer, _pointer + 32); }
  }

  function test_readBytes32_Fuzz_LibBytes(bytes calldata _data, uint256 _index) external {
    bytes32 expected = _data.readBytes32(_index);
    (bytes32 actual, uint256 index) = lib.readBytes32(_data, _index);
    assertEq(actual, expected);
    unchecked { assertEq(index, _index + 32); }
  }
}

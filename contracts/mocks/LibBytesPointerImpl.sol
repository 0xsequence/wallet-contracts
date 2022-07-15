// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "../utils/LibBytesPointer.sol";


contract LibBytesPointerImpl {
  using LibBytesPointer for bytes;

  function readFirstUint16(
    bytes calldata data
  ) external pure returns (
    uint16 a,
    uint256 newPointer
  ) {
    return LibBytesPointer.readFirstUint16(data);
  }

  function readFirstUint8(
    bytes calldata data
  ) external pure returns (
    uint8 a,
    uint256 newPointer
  ) {
    return LibBytesPointer.readFirstUint8(data);
  }

  function readUint8Uint8(
    bytes calldata data,
    uint256 index
  ) external pure returns (
    uint8 a,
    uint8 b,
    uint256 newPointer
  ) {
    return LibBytesPointer.readUint8Uint8(data, index);
  }

  function readAddress(
    bytes calldata data,
    uint256 index
  ) external pure returns (
    address a,
    uint256 newPointer
  ) {
    return LibBytesPointer.readAddress(data, index);
  }

  function readUint16(
    bytes calldata data,
    uint256 index
  ) external pure returns (
    uint16 a,
    uint256 newPointer
  ) {
    return LibBytesPointer.readUint16(data, index);
  }

  function readUint64(
    bytes calldata data,
    uint256 index
  ) external pure returns (
    uint64 a,
    uint256 newPointer
  ) {
    return LibBytesPointer.readUint64(data, index);
  }
}

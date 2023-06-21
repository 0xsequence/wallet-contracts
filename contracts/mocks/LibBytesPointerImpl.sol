// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

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

  function readUint16(
    bytes calldata data,
    uint256 index
  ) external pure returns (
    uint16 a,
    uint256 newPointer
  ) {
    return LibBytesPointer.readUint16(data, index);
  }

  function readUint24(
    bytes calldata data,
    uint256 index
  ) external pure returns (
    uint24 a,
    uint256 newPointer
  ) {
    return LibBytesPointer.readUint24(data, index);
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

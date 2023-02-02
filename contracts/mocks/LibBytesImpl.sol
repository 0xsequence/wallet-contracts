// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "../utils/LibBytes.sol";


contract LibBytesImpl {
  using LibBytes for bytes;

  function readBytes32(
    bytes calldata data,
    uint256 index
  ) external pure returns (
    bytes32 a
  ) {
    return LibBytes.readBytes32(data, index);
  }

  function readUint8(
    bytes calldata data,
    uint256 index
  ) external pure returns (
    uint8 a
  ) {
    return LibBytes.readUint8(data, index);
  }

  function readUint32(
    bytes calldata data,
    uint256 index
  ) external pure returns (
    uint32 a
  ) {
    return LibBytes.readUint32(data, index);
  }
}

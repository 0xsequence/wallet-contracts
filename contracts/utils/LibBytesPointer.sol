// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;


library LibBytesPointer {
  function readFirstUint16(
    bytes calldata data
  ) internal pure returns (
    uint16 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(data.offset)
      a := shr(240, word)
      newPointer := 2
    }
  }

  function readFirstUint8(
    bytes calldata data
  ) internal pure returns (
    uint8 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(data.offset)
      a := shr(248, word)
      newPointer := 1
    }
  }

  function readUint8Uint8(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    uint8 a,
    uint8 b,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(index, data.offset))
      a := shr(248, word)
      b := and(shr(240, word), 0xff)
      newPointer := add(index, 2)
    }
  }

  function readAddress(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    address a,
    uint256 newPointer
  ) {
    assembly  {
      let word := calldataload(add(index,data.offset))
      a := and(shr(96, word), 0xffffffffffffffffffffffffffffffffffffffff)
      newPointer := add(index, 20)
    }
  }

  function readUint16(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    uint16 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(index, data.offset))
      a := and(shr(240, word), 0xffff)
      newPointer := add(index, 2)
    }
  }

  function readUint64(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    uint64 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(index, data.offset))
      a := and(shr(192, word), 0xffffffffffffffff)
      newPointer := add(index, 8)
    }
  }

  function readBytes32(
    bytes calldata _data,
    uint256 _pointer
  ) internal pure returns (
    bytes32 _a,
    uint256 _newPointer
  ) {
    assembly {
      _a := calldataload(add(_pointer, _data.offset))
      _newPointer := add(_pointer, 32)
    }
  }
}

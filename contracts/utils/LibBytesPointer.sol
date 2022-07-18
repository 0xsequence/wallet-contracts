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
    uint256 pointer
  ) internal pure returns (
    uint8 a,
    uint8 b,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(pointer, data.offset))
      a := shr(248, word)
      b := and(shr(240, word), 0xff)
      newPointer := add(pointer, 2)
    }
  }

  function readUint8(
    bytes calldata data,
    uint256 pointer
  ) internal pure returns (
    uint8 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(pointer, data.offset))
      a := shr(248, word)
      newPointer := add(pointer, 1)
    }
  }

  function readAddress(
    bytes calldata data,
    uint256 pointer
  ) internal pure returns (
    address a,
    uint256 newPointer
  ) {
    assembly  {
      let word := calldataload(add(pointer,data.offset))
      a := and(shr(96, word), 0xffffffffffffffffffffffffffffffffffffffff)
      newPointer := add(pointer, 20)
    }
  }

  function readUint16(
    bytes calldata data,
    uint256 pointer
  ) internal pure returns (
    uint16 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(pointer, data.offset))
      a := and(shr(240, word), 0xffff)
      newPointer := add(pointer, 2)
    }
  }

  function readUint64(
    bytes calldata data,
    uint256 pointer
  ) internal pure returns (
    uint64 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(pointer, data.offset))
      a := and(shr(192, word), 0xffffffffffffffff)
      newPointer := add(pointer, 8)
    }
  }

  function readBytes32(
    bytes calldata data,
    uint256 pointer
  ) internal pure returns (
    bytes32 a,
    uint256 newPointer
  ) {
    assembly {
      a := calldataload(add(pointer, data.offset))
      newPointer := add(pointer, 32)
    }
  }
}

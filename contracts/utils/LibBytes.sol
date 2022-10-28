// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;


library LibBytes {
  function readBytes32(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    bytes32 a
  ) {
    assembly {
      a := calldataload(add(data.offset, index))
    }
  }

  function readUint8(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    uint8 a
  ) {
    assembly {
      let word := calldataload(add(index, data.offset))
      a := shr(248, word)
    }
  }

  function readFirstUint16(
    bytes calldata data
  ) internal pure returns (
    uint16 a
  ) {
    assembly {
      let word := calldataload(data.offset)
      a := shr(240, word)
    }
  }

  function readUint32(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    uint32 a
  ) {
    assembly {
      let word := calldataload(add(index, data.offset))
      a := shr(224, word)
    }
  }
}

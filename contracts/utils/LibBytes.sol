/*
  Copyright 2018 ZeroEx Intl.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  This is a truncated version of the original LibBytes.sol library from ZeroEx.
*/

pragma solidity ^0.6.4;

library LibBytes {
  using LibBytes for bytes;

  /***********************************|
  |        Pop Bytes Functions        |
  |__________________________________*/

  /**
   * @dev Pops the last byte off of a byte array by modifying its length.
   * @param b Byte array that will be modified.
   * @return result The byte that was popped off.
   */
  function popLastByte(bytes memory b)
    internal
    pure
    returns (bytes1 result)
  {
    require(
      b.length > 0,
      "LibBytes#popLastByte: GREATER_THAN_ZERO_LENGTH_REQUIRED"
    );

    // Store last byte.
    result = b[b.length - 1];

    assembly {
      // Decrement length of byte array.
      let newLen := sub(mload(b), 1)
      mstore(b, newLen)
    }
    return result;
  }


  /***********************************|
  |        Read Bytes Functions       |
  |__________________________________*/

  /**
   * @dev Reads consecutive uint8 and uint16 values.
   * @param data Byte array to be read.
   * @param index Index in byte array of uint8 and uint16 values.
   * @return a uint8 value of data at given index.
   * @return b uint16 value of data at given index + 8.
   * @return newIndex Updated index after reading the values.
   */
  function readUint8Uint16(
    bytes memory data,
    uint256 index
  ) internal pure returns (
    uint8 a,
    uint16 b,
    uint256 newIndex
  ) {
    assembly {
      let word := mload(add(index, add(32, data)))
      a := shr(248, word)
      b := and(shr(232, word), 0xffff)
      newIndex := add(index, 3)
    }
    require(newIndex <= data.length, "LibBytes#readUint8Uint16: OUT_OF_BOUNDS");
  }

  /**
   * @dev Reads consecutive uint8 and uint8 values.
   * @param data Byte array to be read.
   * @param index Index in byte array of uint8 and uint8 values.
   * @return a uint8 value of data at given index.
   * @return b uint8 value of data at given index + 8.
   * @return newIndex Updated index after reading the values.
   */
  function readUint8Uint8(
    bytes memory data,
    uint256 index
  ) internal pure returns (
    uint8 a,
    uint8 b,
    uint256 newIndex
  ) {
    assembly {
      let word := mload(add(index, add(32, data)))
      a := shr(248, word)
      b := and(shr(240, word), 0xff)
      newIndex := add(index, 2)
    }
    require(newIndex <= data.length, "LibBytes#readUint8Uint8: OUT_OF_BOUNDS");
  }

  /**
   * @dev Reads an address value from a position in a byte array.
   * @param data Byte array to be read.
   * @param index Index in byte array of address value.
   * @return a address value of data at given index.
   * @return newIndex Updated index after reading the value.
   */
  function readAddress(
    bytes memory data,
    uint256 index
  ) internal pure returns (
    address a,
    uint256 newIndex
  ) {
    assembly {
      let word := mload(add(index, add(32, data)))
      a := and(shr(96, word), 0xffffffffffffffffffffffffffffffffffffffff)
      newIndex := add(index, 20)
    }
    require(newIndex <= data.length, "LibBytes#readAddress: OUT_OF_BOUNDS");
  }

  /**
   * @dev Reads 66 bytes from a position in a byte array.
   * @param data Byte array to be read.
   * @param index Index in byte array of 66 bytes value.
   * @return a 66 bytes bytes array value of data at given index.
   * @return newIndex Updated index after reading the value.
   */
  function readBytes66(
    bytes memory data,
    uint256 index
  ) internal pure returns (
    bytes memory a,
    uint256 newIndex
  ) {
    a = new bytes(66);
    assembly {
      let offset := add(32, add(data, index))
      mstore(add(a, 32), mload(offset))
      mstore(add(a, 64), mload(add(offset, 32)))
      mstore(add(a, 66), mload(add(offset, 34)))
      newIndex := add(index, 66)
    }
    require(newIndex <= data.length, "LibBytes#readBytes66: OUT_OF_BOUNDS");
  }

  /**
   * @dev Reads a bytes32 value from a position in a byte array.
   * @param b Byte array containing a bytes32 value.
   * @param index Index in byte array of bytes32 value.
   * @return result bytes32 value from byte array.
   */
  function readBytes32(
    bytes memory b,
    uint256 index
  )
    internal
    pure
    returns (bytes32 result)
  {
    require(
      b.length >= index + 32,
      "LibBytes#readBytes32: GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED"
    );

    // Arrays are prefixed by a 256 bit length parameter
    uint256 pos = index + 32;

    // Read the bytes32 from array memory
    assembly {
      result := mload(add(b, pos))
    }
    return result;
  }


  /***********************************|
  |       Write Bytes Functions       |
  |__________________________________*/

  /**
   * @dev Writes uint16 into bytes array.
   * @param dest Bytes array to be written.
   * @param index Index to start writing value.
   * @param a Uint16 value to be written
   * @return newIndex Updated index after writing the value.
   */
  function writeUint16(
    bytes memory dest,
    uint256 index,
    uint16 a
  ) internal pure returns (uint256 newIndex) {
    assembly {
      let mask240 := 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
      let indx := add(add(32, index), dest)
      let prev := and(mload(indx), mask240)
      mstore(indx, or(shl(240, a), prev))
      newIndex := add(index, 2)
    }
    require(newIndex <= dest.length, "LibBytes#writeUint16: OUT_OF_BOUNDS");
  }

  /**
   * @dev Writes consecutive uint8 and address into bytes array.
   * @param dest Bytes array to be written.
   * @param index Index to start writing value.
   * @param a Uint8 value to be written
   * @param b Address value to be written
   * @return newIndex Updated index after writing the value.
   */
  function writeUint8Address(
    bytes memory dest,
    uint256 index,
    uint8 a,
    address b
  ) internal pure returns (uint256 newIndex) {
    assembly {
      let mask88 := 0xffffffffffffffffffffff
      let indx := add(add(index, 32), dest)
      let prev := and(mload(indx), mask88)
      mstore(indx, or(prev,or(shl(248, a), shl(88, b))))
      newIndex := add(index, 21)
    }
    require(newIndex <= dest.length, "LibBytes#writeUint8Address: OUT_OF_BOUNDS");
  }
}

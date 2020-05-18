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

pragma solidity ^0.6.8;

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
   * @dev Read firsts uint16 value.
   * @param data Byte array to be read.
   * @return a uint16 value of data at index zero.
   * @return newIndex Updated index after reading the values.
   */
  function readFirstUint16(
    bytes memory data
  ) internal pure returns (
    uint16 a,
    uint256 newIndex
  ) {
    assembly {
      let word := mload(add(32, data))
      a := shr(240, word)
      newIndex := 2
    }
    require(2 <= data.length, "LibBytes#readFirstUint16: OUT_OF_BOUNDS");
  }

  /**
   * @dev Reads consecutive bool (8 bits) and uint8 values.
   * @param data Byte array to be read.
   * @param index Index in byte array of uint8 and uint8 values.
   * @return a bool (8 bits) value of data at given index.
   * @return b uint8 value of data at given index + 8.
   * @return newIndex Updated index after reading the values.
   */
  function readBoolUint8(
    bytes memory data,
    uint256 index
  ) internal pure returns (
    bool a,
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
}

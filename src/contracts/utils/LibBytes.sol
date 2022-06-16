// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

library LibBytes {
  using LibBytes for bytes;

  // Errors
  error ReadFirstUint16OutOfBounds(bytes _data);
  error ReadFirstUint8OutOfBounds(bytes _data);
  error ReadUint8Uint8OutOfBounds(bytes _data, uint256 _index);
  error ReadAddressOutOfBounds(bytes _data, uint256 _index);
  error ReadBytes66OutOfBounds(bytes _data, uint256 _index);
  error ReadBytes32OutOfBounds(bytes _data, uint256 _index);
  error ReadUint16OutOfBounds(bytes _data, uint256 _index);
  error ReadBytesOutOfBounds(bytes _datam, uint256 _index, uint256 _length);

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
    if (data.length < 2) revert ReadFirstUint16OutOfBounds(data);
    assembly {
      let word := mload(add(32, data))
      a := shr(240, word)
      newIndex := 2
    }
  }

  function cReadFirstUint16(
    bytes calldata data
  ) internal pure returns (
    uint16 a,
    uint256 newIndex
  ) {
    if (data.length < 2) revert ReadFirstUint16OutOfBounds(data);
    assembly {
      let word := calldataload(data.offset)
      a := shr(240, word)
      newIndex := 2
    }
  }

  function readFirstUint8(
    bytes memory data
  ) internal pure returns (
    uint8 a,
    uint256 newIndex
  ) {
    if (data.length == 0) revert ReadFirstUint8OutOfBounds(data);
    assembly {
      let word := mload(add(32, data))
      a := shr(248, word)
      newIndex := 1
    }
  }

  function cReadFirstUint8(
    bytes calldata data
  ) internal pure returns (
    uint8 a,
    uint256 newIndex
  ) {
    if (data.length == 0) revert ReadFirstUint8OutOfBounds(data);
    assembly {
      let word := calldataload(data.offset)
      a := shr(248, word)
      newIndex := 1
    }
  }

  function mcReadBytes32(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    bytes32 a
  ) {
    assembly {
      a := calldataload(add(data.offset, index))
    }
  }

  function mcReadUint8(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    uint8 a
  ) {
    assembly {
      let word := calldataload(add(data.offset, index))
      a := shr(248, word)
    }
  }

  /**
   * @dev Reads consecutive bool (8 bits) and uint8 values.
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
    if (newIndex > data.length) revert ReadUint8Uint8OutOfBounds(data, index);
  }

  function cReadUint8Uint8(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    uint8 a,
    uint8 b,
    uint256 newIndex
  ) {
    assembly {
      let word := calldataload(add(index, data.offset))
      a := shr(248, word)
      b := and(shr(240, word), 0xff)
      newIndex := add(index, 2)
    }
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
    assembly  {
      let word := mload(add(index, add(32, data)))
      a := and(shr(96, word), 0xffffffffffffffffffffffffffffffffffffffff)
      newIndex := add(index, 20)
    }
    if (newIndex > data.length) revert ReadAddressOutOfBounds(data, index);
  }

  function cReadAddress(
    bytes calldata data,
    uint256 index
  ) internal pure returns (
    address a,
    uint256 newIndex
  ) {
    assembly  {
      let word := calldataload(add(index,data.offset))
      a := and(shr(96, word), 0xffffffffffffffffffffffffffffffffffffffff)
      newIndex := add(index, 20)
    }
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
    if (newIndex > data.length) revert ReadBytes66OutOfBounds(data, index);
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
  ) internal pure returns (bytes32 result) {
    // Arrays are prefixed by a 256 bit length parameter
    uint256 pos = index + 32;

    if (b.length < pos) revert ReadBytes32OutOfBounds(b, index);

    // Read the bytes32 from array memory
    assembly {
      result := mload(add(b, pos))
    }
    return result;
  }

  /**
   * @dev Reads an uint16 value from a position in a byte array.
   * @param data Byte array to be read.
   * @param index Index in byte array of uint16 value.
   * @return a uint16 value of data at given index.
   * @return newIndex Updated index after reading the value.
   */
  function readUint16(
    bytes memory data,
    uint256 index
  ) internal pure returns (uint16 a, uint256 newIndex) {
    assembly {
      let word := mload(add(index, add(32, data)))
      a := and(shr(240, word), 0xffff)
      newIndex := add(index, 2)
    }
    if (newIndex > data.length) revert ReadUint16OutOfBounds(data, index);
  }

  function cReadUint16(
    bytes calldata data,
    uint256 index
  ) internal pure returns (uint16 a, uint256 newIndex) {
    assembly {
      let word := calldataload(add(index, data.offset))
      a := and(shr(240, word), 0xffff)
      newIndex := add(index, 2)
    }
  }

  /**
   * @dev Reads bytes from a position in a byte array.
   * @param data Byte array to be read.
   * @param index Index in byte array of bytes value.
   * @param size Number of bytes to read.
   * @return a bytes bytes array value of data at given index.
   * @return newIndex Updated index after reading the value.
   */
  function readBytes(
    bytes memory data,
    uint256 index,
    uint256 size
  ) internal pure returns (bytes memory a, uint256 newIndex) {
    a = new bytes(size);

    assembly {
      let offset := add(32, add(data, index))

      let i := 0 let n := 32
      // Copy each word, except last one
      for { } lt(n, size) { i := n n := add(n, 32) } {
        mstore(add(a, n), mload(add(offset, i)))
      }

      // Load word after new array
      let suffix := add(a, add(32, size))
      let suffixWord := mload(suffix)

      // Copy last word, overwrites after array 
      mstore(add(a, n), mload(add(offset, i)))

      // Restore after array
      mstore(suffix, suffixWord)

      newIndex := add(index, size)
    }

    assert(newIndex >= index);
    if (newIndex > data.length) revert ReadBytesOutOfBounds(data, index, size);
  }

  function splitSigAndArgs(
    bytes memory data
  ) internal pure returns (
    bytes4 sig,
    bytes memory args
  ) {
    assembly {
      // First 4 bytes are the signature
      sig := and(0xffffffff, mload(add(data, 32)))
    }

    (args,) = readBytes(data, 4, data.length - 4);
  }
}

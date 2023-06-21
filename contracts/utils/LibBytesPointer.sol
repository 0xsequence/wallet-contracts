// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


/**
 * @title Library for reading data from bytes arrays with a pointer
 * @author Agustin Aguilar (aa@horizon.io)
 * @notice This library contains functions for reading data from bytes arrays with a pointer.
 *
 * @dev These functions do not check if the input index is within the bounds of the data array.
 *         Reading out of bounds may return dirty values.
 */
library LibBytesPointer {

  /**
   * @dev Returns the first uint16 value in the input data and updates the pointer.
   * @param _data The input data.
   * @return a The first uint16 value.
   * @return newPointer The new pointer.
   */
  function readFirstUint16(
    bytes calldata _data
  ) internal pure returns (
    uint16 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(_data.offset)
      a := shr(240, word)
      newPointer := 2
    }
  }

  /**
   * @notice Returns the uint8 value at the given index in the input data and updates the pointer.
   * @param _data The input data.
   * @param _index The index of the value to retrieve.
   * @return a The uint8 value at the given index.
   * @return newPointer The new pointer.
   */
  function readUint8(
    bytes calldata _data,
    uint256 _index
  ) internal pure returns (
    uint8 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(_index, _data.offset))
      a := shr(248, word)
      newPointer := add(_index, 1)
    }
  }

  /**
   * @notice Returns the uint8 value and the address at the given index in the input data and updates the pointer.
   * @param _data The input data.
   * @param _index The index of the value to retrieve.
   * @return a The uint8 value at the given index.
   * @return b The following address value.
   * @return newPointer The new pointer.
   */
  function readUint8Address(
    bytes calldata _data,
    uint256 _index
  ) internal pure returns (
    uint8 a,
    address b,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(_index, _data.offset))
      a := shr(248, word)
      b := and(shr(88, word), 0xffffffffffffffffffffffffffffffffffffffff)
      newPointer := add(_index, 21)
    }
  }

  /**
   * @notice Returns the uint16 value at the given index in the input data and updates the pointer.
   * @param _data The input data.
   * @param _index The index of the value to retrieve.
   * @return a The uint16 value at the given index.
   * @return newPointer The new pointer.
   */
  function readUint16(
    bytes calldata _data,
    uint256 _index
  ) internal pure returns (
    uint16 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(_index, _data.offset))
      a := and(shr(240, word), 0xffff)
      newPointer := add(_index, 2)
    }
  }

  /**
   * @notice Returns the uint24 value at the given index in the input data and updates the pointer.
   * @param _data The input data.
   * @param _index The index of the value to retrieve.
   * @return a The uint24 value at the given index.
   * @return newPointer The new pointer.
   */
  function readUint24(
    bytes calldata _data,
    uint256 _index
  ) internal pure returns (
    uint24 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(_index, _data.offset))
      a := and(shr(232, word), 0xffffff)
      newPointer := add(_index, 3)
    }
  }

  /**
   * @notice Returns the uint64 value at the given index in the input data and updates the pointer.
   * @param _data The input data.
   * @param _index The index of the value to retrieve.
   * @return a The uint64 value at the given index.
   * @return newPointer The new pointer.
   */
  function readUint64(
    bytes calldata _data,
    uint256 _index
  ) internal pure returns (
    uint64 a,
    uint256 newPointer
  ) {
    assembly {
      let word := calldataload(add(_index, _data.offset))
      a := and(shr(192, word), 0xffffffffffffffff)
      newPointer := add(_index, 8)
    }
  }

  /**
   * @notice Returns the bytes32 value at the given index in the input data and updates the pointer.
   * @param _data The input data.
   * @param _pointer The index of the value to retrieve.
   * @return a The bytes32 value at the given index.
   * @return newPointer The new pointer.
   */
  function readBytes32(
    bytes calldata _data,
    uint256 _pointer
  ) internal pure returns (
    bytes32 a,
    uint256 newPointer
  ) {
    assembly {
      a := calldataload(add(_pointer, _data.offset))
      newPointer := add(_pointer, 32)
    }
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


/**
 * @title Library for reading data from bytes arrays
 * @author Agustin Aguilar (aa@horizon.io)
 * @notice This library contains functions for reading data from bytes arrays.
 *
 * @dev These functions do not check if the input index is within the bounds of the data array.
 *         Reading out of bounds may return dirty values.
 */
library LibBytes {

  /**
   * @notice Returns the bytes32 value at the given index in the input data.
   * @param data The input data.
   * @param index The index of the value to retrieve.
   * @return a The bytes32 value at the given index.
   */
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

  /**
   * @notice Returns the uint8 value at the given index in the input data.
   * @param data The input data.
   * @param index The index of the value to retrieve.
   * @return a The uint8 value at the given index.
   */
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

  /**
   * @notice Returns the first uint16 value in the input data.
   * @param data The input data.
   * @return a The first uint16 value in the input data.
   */
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

  /**
   * @notice Returns the uint32 value at the given index in the input data.
   * @param data The input data.
   * @param index The index of the value to retrieve.
   * @return a The uint32 value at the given index.
   */
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

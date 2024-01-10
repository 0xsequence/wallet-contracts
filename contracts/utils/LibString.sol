// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

/**
 * @title Library for string manipulation operations
 * @notice This library contains functions for manipulating strings in Solidity.
 */
library LibString {
  bytes private constant ALPHABET_HEX_16 = '0123456789abcdef';
  bytes private constant ALPHABET_32 = 'abcdefghijklmnopqrstuvwxyz234567';
  bytes private constant ALPHABET_64_URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

  /**
   * @notice Checks if `_str` contains `_substr` starting at `_location`.
   * @param _substr Substring to search for.
   * @param _str String to search within.
   * @param _location Starting index in `_str` for the search.
   * @return True if `_substr` is found at `_location` in `_str`, otherwise false.
   */
  function contains(
    string memory _str,
    string memory _substr,
    uint256 _location
  ) internal pure returns (bool) {
    if (_location >= bytes(_str).length) {
      return false;
    }

    uint256 strLen = bytes(_substr).length;

    bytes32 result1;
    bytes32 result2;

    /// @solidity memory-safe-assembly
    assembly {
      result1 := keccak256(add(_substr, 32), strLen)
      result2 := keccak256(add(_str, add(32, _location)), strLen)
    }

    return result1 == result2;
  }

  /**
   * @notice Prefixes a hexadecimal string with "0x".
   * @param _hex The hexadecimal string to prefix.
   * @return The prefixed hexadecimal string.
   */
  function prefixHexadecimal(string memory _hex) internal pure returns (string memory) {
    return string(abi.encodePacked('0x', _hex));
  }

  /**
   * @notice Prefixes a base32 string with "b".
   * @param _base32 The base32 string to prefix.
   * @return The prefixed base32 string.
   */
  function prefixBase32(string memory _base32) internal pure returns (string memory) {
    return string(abi.encodePacked('b', _base32));
  }

  /**
   * @notice Converts a byte array to a hexadecimal string.
   * @param _bytes The byte array to convert.
   * @return The resulting hexadecimal string.
   */
  function bytesToHexadecimal(bytes memory _bytes) internal pure returns (string memory) {
    uint256 bytesLength = _bytes.length;
    bytes memory bytesArray = new bytes(bytesLength << 1);

    unchecked {
      for (uint256 i = 0; i < bytesLength; i++) {
        uint256 word = uint8(_bytes[i]);
        uint256 ib = i << 1;
        bytesArray[ib] = bytes1(ALPHABET_HEX_16[word >> 4]);
        bytesArray[ib + 1] = bytes1(ALPHABET_HEX_16[word & 0xf]);
      }
    }

    return string(bytesArray);
  }

  /**
   * @notice Converts a byte array to a base32 string.
   * @param _bytes The byte array to convert.
   * @return The resulting base32 string.
   */
  function bytesToBase32(bytes memory _bytes) internal pure returns (string memory) {
    uint256 bytesLength = _bytes.length;

    uint256 t1 = bytesLength << 3;

    unchecked {
      // base32-encoded length = ceil(# of bits / 5)
      bytes memory bytesArray = new bytes((t1 + 4) / 5);

      uint256 bits = 0;
      uint256 buffer = 0;
      uint256 pointer = 0;

      for (uint256 i = 0; i < bytesLength; i++) {
        buffer = (buffer << 8) | uint8(_bytes[i]);
        bits += 8;

        while (bits >= 5) {
          bits -= 5;
          bytesArray[pointer] = bytes1(ALPHABET_32[(buffer >> bits) & 0x1f]);
          pointer++;
        }
      }

      if (bits > 0) {
        bytesArray[pointer] = bytes1(ALPHABET_32[(buffer << (5 - bits)) & 0x1f]);
      }

      return string(bytesArray);
    }
  }

  /**
   * @notice Converts a byte array to a base64 URL string.
   * @param _bytes The byte array to convert.
   * @return The resulting base64 URL string.
   * @dev This function is based on the implementation provided by OpenZeppelin:
   * - MIT license - OpenZeppelin Contracts (last updated v5.0.0) (utils/Base64.sol)
   */
  function bytesToBase64URL(bytes memory _bytes) internal pure returns (string memory) {
    /**
     * Inspired by Brecht Devos (Brechtpd) implementation - MIT licence
     * https://github.com/Brechtpd/base64/blob/e78d9fd951e7b0977ddca77d92dc85183770daf4/base64.sol
     */
    if (_bytes.length == 0) return "";

    // Loads the table into memory
    bytes memory table = ALPHABET_64_URL;

    // Encoding takes 3-byte chunks of binary data from the `_bytes` parameter
    // and splits them into 4 numbers of 6 bits each.
    // For no-padding Base64 URL, the final length should be the exact number of required characters,
    // without rounding up to the nearest multiple of 4.
    // - `4 * _bytes.length / 3` computes the base length (ignoring leftover bytes)
    // - The conditional adds extra characters for leftover bytes (if any):
    //   - If there's 1 leftover byte, 2 extra characters are needed.
    //   - If there are 2 leftover bytes, 3 extra characters are needed.
    uint256 encodedLen = 4 * _bytes.length / 3; 
    if (_bytes.length % 3 > 0) { 
        encodedLen += 2 - (_bytes.length % 3 - 1); 
    }
    string memory result = new string(encodedLen);

    /// @solidity memory-safe-assembly
    assembly {
      // Prepare the lookup table (skip the first "length" byte)
      let tablePtr := add(table, 1)

      // Prepare result pointer, jump over length
      let resultPtr := add(result, 32)

      // Run over the input, 3 bytes at a time
      for {
        let dataPtr := _bytes
        let endPtr := add(_bytes, mload(_bytes))
      } lt(dataPtr, endPtr) { } {
        // Advance 3 bytes
        dataPtr := add(dataPtr, 3)
        let input := mload(dataPtr)

        // To write each character, shift the 3 bytes (18 bits) chunk
        // 4 times in blocks of 6 bits for each character (18, 12, 6, 0)
        // and apply logical AND with 0x3F which is the number of
        // the previous character in the ASCII table prior to the Base64 Table
        // The result is then added to the table to get the character to write,
        // and finally write it in the result pointer but with a left shift
        // of 256 (1 byte) - 8 (1 ASCII char) = 248 bits

        mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
        resultPtr := add(resultPtr, 1) // Advance

        mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
        resultPtr := add(resultPtr, 1) // Advance

        mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
        resultPtr := add(resultPtr, 1) // Advance

        mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
        resultPtr := add(resultPtr, 1) // Advance
      }
    }

    return result;
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;


library LibString {
  bytes private constant ALPHABET_HEX_16 = '0123456789abcdef';
  bytes private constant ALPHABET_32 = 'abcdefghijklmnopqrstuvwxyz234567';

  function prefixHexadecimal(string memory _hex) internal pure returns (string memory) {
    return string(abi.encodePacked('0x', _hex));
  }

  function prefixBase32(string memory _base32) internal pure returns (string memory) {
    return string(abi.encodePacked('b', _base32));
  }

  function bytesToHexadecimal(bytes memory _bytes) internal pure returns (string memory) {
    uint256 bytesLength = _bytes.length;
    bytes memory bytesArray = new bytes(bytesLength * 2);

    unchecked {
      for (uint256 i = 0; i < bytesLength; i++) {
        uint256 word = uint8(_bytes[i]);
        uint256 ib = i * 2;
        bytesArray[ib] = bytes1(ALPHABET_HEX_16[word >> 4]);
        bytesArray[ib + 1] = bytes1(ALPHABET_HEX_16[word & 0xf]);
      }
    }

    return string(bytesArray);
  }

  function bytesToBase32(bytes memory _bytes) internal pure returns (string memory) {
    uint256 bytesLength = _bytes.length;

    uint256 t1 = bytesLength * 8;

    unchecked {
      uint256 newSize = t1 / 5;
      if (t1 % 5 != 0) newSize++;

      bytes memory bytesArray = new bytes(newSize);

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
}

pragma solidity 0.8.19;


library BytesUtils {
  /*
  * @dev Returns the keccak-256 hash of a byte range.
  * @param self The byte string to hash.
  * @param offset The position to start hashing at.
  * @param len The number of bytes to hash.
  * @return The hash of the byte range.
  */
  function keccak(bytes memory self, uint offset, uint len) internal pure returns (bytes32 ret) {
    require(offset + len <= self.length);
    assembly {
      ret := keccak256(add(add(self, 32), offset), len)
    }
  }

  /*
  * @dev Returns the 8-bit number at the specified index of self.
  * @param self The byte string.
  * @param idx The index into the bytes
  * @return The specified 8 bits of the string, interpreted as an integer.
  */
  function readUint8(bytes memory self, uint idx) internal pure returns (uint8 ret) {
    return uint8(self[idx]);
  }

  /*
  * @dev Returns the 16-bit number at the specified index of self.
  * @param self The byte string.
  * @param idx The index into the bytes
  * @return The specified 16 bits of the string, interpreted as an integer.
  */
  function readUint16(bytes memory self, uint idx) internal pure returns (uint16 ret) {
    require(idx + 2 <= self.length);
    assembly {
      ret := and(mload(add(add(self, 2), idx)), 0xFFFF)
    }
  }

  /*
  * @dev Returns the n byte value at the specified index of self.
  * @param self The byte string.
  * @param idx The index into the bytes.
  * @param len The number of bytes.
  * @return The specified 32 bytes of the string.
  */
  function readBytesN(bytes memory self, uint idx, uint len) internal pure returns (bytes32 ret) {
    unchecked {
      require(len <= 32);
      require(idx + len <= self.length);
      assembly {
        let mask := not(sub(exp(256, sub(32, len)), 1))
        ret := and(mload(add(add(self, 32), idx)),  mask)
      }
    }
  }

  function memcpy(uint dest, uint src, uint len) private pure {
    unchecked {
      // Copy word-length chunks while possible
      for (; len >= 32; len -= 32) {
        assembly {
          mstore(dest, mload(src))
        }
        dest += 32;
        src += 32;
      }

      // Copy remaining bytes
      uint mask = 256 ** (32 - len) - 1;
      assembly {
        let srcpart := and(mload(src), not(mask))
        let destpart := and(mload(dest), mask)
        mstore(dest, or(destpart, srcpart))
      }
    }
  }

  /*
  * @dev Copies a substring into a new byte string.
  * @param self The byte string to copy from.
  * @param offset The offset to start copying at.
  * @param len The number of bytes to copy.
  */
  function substring(bytes memory self, uint offset, uint len) internal pure returns(bytes memory) {
    unchecked {
      require(offset + len <= self.length);

      bytes memory ret = new bytes(len);
      uint dest;
      uint src;

      assembly {
        dest := add(ret, 32)
        src := add(add(self, 32), offset)
      }
      memcpy(dest, src, len);

      return ret;
    }
  }

  // Maps characters from 0x30 to 0x7A to their base32 values.
  // 0xFF represents invalid characters in that range.
  bytes constant base32HexTable = hex'00010203040506070809FFFFFFFFFFFFFF0A0B0C0D0E0F101112131415161718191A1B1C1D1E1FFFFFFFFFFFFFFFFFFFFF0A0B0C0D0E0F101112131415161718191A1B1C1D1E1F';

  /**
   * @dev Decodes unpadded base32 data of up to one word in length.
   * @param self The data to decode.
   * @param off Offset into the string to start at.
   * @param len Number of characters to decode.
   * @return The decoded data, left aligned.
   */
  function base32HexDecodeWord(bytes memory self, uint off, uint len) internal pure returns(bytes32) {
    unchecked {
      require(len <= 52);

      uint ret = 0;
      uint8 decoded;
      for(uint i = 0; i < len; i++) {
        bytes1 char = self[off + i];
        require(char >= 0x30 && char <= 0x7A);
        decoded = uint8(base32HexTable[uint(uint8(char)) - 0x30]);
        require(decoded <= 0x20);
        if(i == len - 1) {
          break;
        }
        ret = (ret << 5) | decoded;
      }

      uint bitlen = len * 5;
      if(len % 8 == 0) {
        // Multiple of 8 characters, no padding
        ret = (ret << 5) | decoded;
      } else if(len % 8 == 2) {
        // Two extra characters - 1 byte
        ret = (ret << 3) | (decoded >> 2);
        bitlen -= 2;
      } else if(len % 8 == 4) {
        // Four extra characters - 2 bytes
        ret = (ret << 1) | (decoded >> 4);
        bitlen -= 4;
      } else if(len % 8 == 5) {
        // Five extra characters - 3 bytes
        ret = (ret << 4) | (decoded >> 1);
        bitlen -= 1;
      } else if(len % 8 == 7) {
        // Seven extra characters - 4 bytes
        ret = (ret << 2) | (decoded >> 3);
        bitlen -= 3;
      } else {
        revert();
      }

      return bytes32(ret << (256 - bitlen));
    }
  }
}

// Source: https://github.com/JonahGroendal/asn1-decode
// License: MIT

library NodePtr {
  // Unpack first byte index
  function ixs(uint self) internal pure returns (uint) {
    unchecked {
      return uint80(self);
    }
  }
  // Unpack first content byte index
  function ixf(uint self) internal pure returns (uint) {
    unchecked {
      return uint80(self>>80);
    }
  }
  // Unpack last content byte index
  function ixl(uint self) internal pure returns (uint) {
    unchecked {
      return uint80(self>>160);
    }
  }
  // Pack 3 uint80s into a uint256
  function getPtr(uint _ixs, uint _ixf, uint _ixl) internal pure returns (uint) {
    unchecked {
      _ixs |= _ixf<<80;
      _ixs |= _ixl<<160;
      return _ixs;
    }
  }
}

library Asn1Decode {
  using NodePtr for uint;
  using BytesUtils for bytes;

  /*
   * @dev Get the root node. First step in traversing an ASN1 structure
   * @param der The DER-encoded ASN1 structure
   * @return A pointer to the outermost node
   */
  function root(bytes memory der) internal pure returns (uint) {
  	return readNodeLength(der, 0);
  }

  /*
   * @dev Get the root node of an ASN1 structure that's within a bit string value
   * @param der The DER-encoded ASN1 structure
   * @return A pointer to the outermost node
   */
  function rootOfBitStringAt(bytes memory der, uint ptr) internal pure returns (uint) {
    unchecked {
      require(der[ptr.ixs()] == 0x03, "Not type BIT STRING");
      return readNodeLength(der, ptr.ixf()+1);
    }
  }

  /*
   * @dev Get the root node of an ASN1 structure that's within an octet string value
   * @param der The DER-encoded ASN1 structure
   * @return A pointer to the outermost node
   */
  function rootOfOctetStringAt(bytes memory der, uint ptr) internal pure returns (uint) {
    unchecked {
      require(der[ptr.ixs()] == 0x04, "Not type OCTET STRING");
      return readNodeLength(der, ptr.ixf());
    }
  }

  /*
   * @dev Get the next sibling node
   * @param der The DER-encoded ASN1 structure
   * @param ptr Points to the indices of the current node
   * @return A pointer to the next sibling node
   */
  function nextSiblingOf(bytes memory der, uint ptr) internal pure returns (uint) {
    unchecked {
  	  return readNodeLength(der, ptr.ixl()+1);
    }
  }

  /*
   * @dev Get the first child node of the current node
   * @param der The DER-encoded ASN1 structure
   * @param ptr Points to the indices of the current node
   * @return A pointer to the first child node
   */
  function firstChildOf(bytes memory der, uint ptr) internal pure returns (uint) {
    unchecked {
      require(der[ptr.ixs()] & 0x20 == 0x20, "Not a constructed type");
      return readNodeLength(der, ptr.ixf());
    }
  }

  /*
   * @dev Use for looping through children of a node (either i or j).
   * @param i Pointer to an ASN1 node
   * @param j Pointer to another ASN1 node of the same ASN1 structure
   * @return True iff j is child of i or i is child of j.
   */
  function isChildOf(uint i, uint j) internal pure returns (bool) {
    unchecked {
      return ( ((i.ixf() <= j.ixs()) && (j.ixl() <= i.ixl())) ||
              ((j.ixf() <= i.ixs()) && (i.ixl() <= j.ixl())) );
    }
  }

  /*
   * @dev Extract value of node from DER-encoded structure
   * @param der The der-encoded ASN1 structure
   * @param ptr Points to the indices of the current node
   * @return Value bytes of node
   */
  function bytesAt(bytes memory der, uint ptr) internal pure returns (bytes memory) {
    unchecked {
      return der.substring(ptr.ixf(), ptr.ixl()+1 - ptr.ixf());
    }
  }

  /*
   * @dev Extract entire node from DER-encoded structure
   * @param der The DER-encoded ASN1 structure
   * @param ptr Points to the indices of the current node
   * @return All bytes of node
   */
  function allBytesAt(bytes memory der, uint ptr) internal pure returns (bytes memory) {
    unchecked {
      return der.substring(ptr.ixs(), ptr.ixl()+1 - ptr.ixs());
    }
  }

  /*
   * @dev Extract value of node from DER-encoded structure
   * @param der The DER-encoded ASN1 structure
   * @param ptr Points to the indices of the current node
   * @return Value bytes of node as bytes32
   */
  function bytes32At(bytes memory der, uint ptr) internal pure returns (bytes32) {
    unchecked {
      return der.readBytesN(ptr.ixf(), ptr.ixl()+1 - ptr.ixf());
    }
  }

  /*
   * @dev Extract value of node from DER-encoded structure
   * @param der The der-encoded ASN1 structure
   * @param ptr Points to the indices of the current node
   * @return Uint value of node
   */
  function uintAt(bytes memory der, uint ptr) internal pure returns (uint) {
    unchecked {
      require(der[ptr.ixs()] == 0x02, "Not type INTEGER");
      require(der[ptr.ixf()] & 0x80 == 0, "Not positive");
      uint len = ptr.ixl()+1 - ptr.ixf();
      return uint(der.readBytesN(ptr.ixf(), len) >> (32-len)*8);
    }
  }

  /*
   * @dev Extract value of a positive integer node from DER-encoded structure
   * @param der The DER-encoded ASN1 structure
   * @param ptr Points to the indices of the current node
   * @return Value bytes of a positive integer node
   */
  function uintBytesAt(bytes memory der, uint ptr) internal pure returns (bytes memory) {
    unchecked {
      require(der[ptr.ixs()] == 0x02, "Not type INTEGER");
      require(der[ptr.ixf()] & 0x80 == 0, "Not positive");
      uint valueLength = ptr.ixl()+1 - ptr.ixf();
      if (der[ptr.ixf()] == 0)
        return der.substring(ptr.ixf()+1, valueLength-1);
      else
        return der.substring(ptr.ixf(), valueLength);
    }
  }

  function keccakOfBytesAt(bytes memory der, uint ptr) internal pure returns (bytes32) {
    unchecked {
      return der.keccak(ptr.ixf(), ptr.ixl()+1 - ptr.ixf());
    }
  }

  function keccakOfAllBytesAt(bytes memory der, uint ptr) internal pure returns (bytes32) {
    unchecked {
      return der.keccak(ptr.ixs(), ptr.ixl()+1 - ptr.ixs());
    }
  }

  /*
   * @dev Extract value of bitstring node from DER-encoded structure
   * @param der The DER-encoded ASN1 structure
   * @param ptr Points to the indices of the current node
   * @return Value of bitstring converted to bytes
   */
  function bitstringAt(bytes memory der, uint ptr) internal pure returns (bytes memory) {
    unchecked {
      require(der[ptr.ixs()] == 0x03, "Not type BIT STRING");
      // Only 00 padded bitstr can be converted to bytestr!
      require(der[ptr.ixf()] == 0x00);
      uint valueLength = ptr.ixl()+1 - ptr.ixf();
      return der.substring(ptr.ixf()+1, valueLength-1);
    }
  }

  function readNodeLength(bytes memory der, uint ix) private pure returns (uint) {
    unchecked {
      uint length;
      uint80 ixFirstContentByte;
      uint80 ixLastContentByte;
      if ((der[ix+1] & 0x80) == 0) {
        length = uint8(der[ix+1]);
        ixFirstContentByte = uint80(ix+2);
        ixLastContentByte = uint80(ixFirstContentByte + length -1);
      } else {
        uint8 lengthbytesLength = uint8(der[ix+1] & 0x7F);
        if (lengthbytesLength == 1)
          length = der.readUint8(ix+2);
        else if (lengthbytesLength == 2)
          length = der.readUint16(ix+2);
        else
          length = uint(der.readBytesN(ix+2, lengthbytesLength) >> (32-lengthbytesLength)*8);
        ixFirstContentByte = uint80(ix+2+lengthbytesLength);
        ixLastContentByte = uint80(ixFirstContentByte + length -1);
      }
      return NodePtr.getPtr(ix, ixFirstContentByte, ixLastContentByte);
    }
  }
}

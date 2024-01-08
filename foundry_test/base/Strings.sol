pragma solidity 0.8.19;

library Strings {
  function eq(string memory a, string memory b) internal pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
  }

  function concat(string memory a, string memory b) internal pure returns (string memory) {
    return string(abi.encodePacked(a, b));
  }

  function concat(string memory a, string memory b, string memory c) internal pure returns (string memory) {
    return string(abi.encodePacked(a, b, c));
  }

  function concat(string memory a, string memory b, string memory c, string memory d) internal pure returns (string memory) {
    return string(abi.encodePacked(a, b, c, d));
  }

  function concat(string memory a, string memory b, string memory c, string memory d, string memory e) internal pure returns (string memory) {
    return string(abi.encodePacked(a, b, c, d, e));
  }

  function concat(string memory a, string memory b, string memory c, string memory d, string memory e, string memory f) internal pure returns (string memory) {
    return string(abi.encodePacked(a, b, c, d, e, f));
  }

  function parseHex(string memory hexString) public pure returns (bytes memory) {
    bytes memory b = bytes(hexString);

    if (b.length == 0) {
      return new bytes(0);
    }

    if(b.length % 2 != 0) {
      revert("Invalid hex string length");
    }

    uint256 startIndex = 0;
    if(b[0] == '0' && (b[1] == 'x' || b[1] == 'X')) {
      startIndex = 2;
    }
    
    bytes memory result = new bytes((b.length - startIndex) / 2);

    for(uint256 i = startIndex; i < b.length; i += 2) {
      result[(i - startIndex) / 2] = bytes1(fromHexChar(uint8(b[i])) * 16 + fromHexChar(uint8(b[i + 1])));
    }

    return result;
  }

  function fromHexChar(uint8 c) internal pure returns (uint8) {
    if (c >= uint8(bytes1('0')) && c <= uint8(bytes1('9'))) {
      return c - uint8(bytes1('0'));
    } else if (c >= uint8(bytes1('a')) && c <= uint8(bytes1('f'))) {
      return 10 + c - uint8(bytes1('a'));
    } else if (c >= uint8(bytes1('A')) && c <= uint8(bytes1('F'))) {
      return 10 + c - uint8(bytes1('A'));
    } else {
      revert("Invalid hexadecimal character");
    }
  }
}
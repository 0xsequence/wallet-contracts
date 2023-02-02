// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "../utils/LibString.sol";


contract LibStringImp {
  using LibString for string;

  function prefixBase32(string calldata data) external pure returns (string memory) {
    return LibString.prefixBase32(data);
  }

  function prefixHexadecimal(string calldata data) external pure returns (string memory) {
    return LibString.prefixHexadecimal(data);
  }

  function bytesToBase32(bytes calldata data) external pure returns (string memory) {
    return LibString.bytesToBase32(data);
  }

  function bytesToHexadecimal(bytes calldata data) external pure returns (string memory) {
    return LibString.bytesToHexadecimal(data);
  }
}

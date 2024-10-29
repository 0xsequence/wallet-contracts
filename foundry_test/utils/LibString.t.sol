// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "contracts/utils/LibString.sol";

import "foundry_test/base/AdvTest.sol";


contract LibStringImp {
  function contains(string memory _a, string memory _b, uint256 _l) external pure returns (bool) {
    return LibString.contains(_a, _b, _l);
  }

  function prefixHexadecimal(string memory _a) external pure returns (string memory) {
    return LibString.prefixHexadecimal(_a);
  }

  function prefixBase32(string memory _a) external pure returns (string memory) {
    return LibString.prefixBase32(_a);
  }

  function bytesToHexadecimal(bytes memory _a) external pure returns (string memory) {
    return LibString.bytesToHexadecimal(_a);
  }

  function bytesToBase32(bytes memory _a) external pure returns (string memory) {
    return LibString.bytesToBase32(_a);
  }

  function bytesToBase64URL(bytes memory _a) external pure returns (string memory) {
    return LibString.bytesToBase64URL(_a);
  }
}

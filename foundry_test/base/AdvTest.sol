// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "forge-std/Test.sol";


contract AdvTest is Test {
  function boundDiff(uint256 _a, uint256 _b) internal pure returns (uint256) {
    if (_a != _b) return _a;

    uint256 res = _b == type(uint256).max ? 0 : _b + 1;
    return res;
  }
}

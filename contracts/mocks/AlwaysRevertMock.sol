// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;


contract AlwaysRevertMock {
  fallback() external payable {
    revert("AlwaysRevertMock#fallback: ALWAYS_REVERT");
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;


interface IERC223Receiver {
  function tokenFallback(address, uint256, bytes calldata) external;
}

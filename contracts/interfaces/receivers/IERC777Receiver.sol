// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

interface IERC777Receiver {
    function tokensReceived(address, address, address, uint256, bytes calldata, bytes calldata) external;
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;


interface IERC721Receiver {
  function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4);
}

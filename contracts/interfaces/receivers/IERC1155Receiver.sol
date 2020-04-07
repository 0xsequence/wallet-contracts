pragma solidity ^0.6.5;


interface IERC1155Receiver {
  function onERC1155Received(address, address, uint256, uint256, bytes calldata) external returns (bytes4);
  function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external returns (bytes4);
}

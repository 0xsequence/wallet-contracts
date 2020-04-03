pragma solidity ^0.6.4;


interface IERC223Receiver {
  function tokenFallback(address, uint256, bytes calldata) external;
}

pragma solidity 0.7.4;


interface IERC223Receiver {
  function tokenFallback(address, uint256, bytes calldata) external;
}

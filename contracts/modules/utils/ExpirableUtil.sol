pragma solidity ^0.6.8;


contract ExpirableUtil {
  function requireNonExpired(uint256 _expiration) external view {
    require(block.timestamp < _expiration, "ExpirableUtil:requireNonExpired: EXPIRED");
  }
}

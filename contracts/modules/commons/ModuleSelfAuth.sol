pragma solidity 0.7.4;


contract ModuleSelfAuth {
  modifier onlySelf() {
    require(msg.sender == address(this), "ModuleSelfAuth#onlySelf: NOT_AUTHORIZED");
    _;
  }
}

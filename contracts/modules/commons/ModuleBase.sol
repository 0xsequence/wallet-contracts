pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;


contract ModuleBase {
  modifier onlySelf() {
    require(msg.sender == address(this), "ModuleBase#onlySelf: NOT_AUTHORIZED");
    _;
  }
}

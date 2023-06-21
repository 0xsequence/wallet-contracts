// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


contract CallReceiverMock {
  uint256 public lastValA;
  bytes public lastValB;

  bool revertFlag;

  constructor() payable { }

  function setRevertFlag(bool _revertFlag) external {
    revertFlag = _revertFlag;
  }

  function testCall(uint256 _valA, bytes calldata _valB) external payable {
    require(!revertFlag, "CallReceiverMock#testCall: REVERT_FLAG");

    lastValA = _valA;
    lastValB = _valB;
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "../modules/commons/ModuleEIP4337.sol";


contract EntryPointMock {
  error NotEnoughPrefund(uint256 _required, uint256 _actual);
  error CallFailed();

  function mockRelay(
    ModuleEIP4337.UserOperation calldata _operation,
    bytes32 _requestId,
    uint256 _requiredPrefund
  ) external {
    uint256 prevFund = address(this).balance;

    ModuleEIP4337(_operation.sender).validateUserOp(_operation, _requestId, _requiredPrefund);

    if (address(this).balance - prevFund < _requiredPrefund) {
      revert NotEnoughPrefund(_requiredPrefund, address(this).balance - prevFund);
    }

    // solhint-disable-next-line
    (bool res,) = _operation.sender.call(_operation.callData);
    if (!res) revert CallFailed();
  }

  function onlyValidate(
    ModuleEIP4337.UserOperation calldata _operation,
    bytes32 _requestId,
    uint256 _requiredPrefund
  ) external {
    ModuleEIP4337(_operation.sender).validateUserOp(_operation, _requestId, _requiredPrefund);
  }

  function onlyCall(
    ModuleEIP4337.UserOperation calldata _operation
  ) external {
    // solhint-disable-next-line
    (bool res,) = _operation.sender.call(_operation.callData);
    if (!res) revert CallFailed();
  }

  receive() external payable {}
}

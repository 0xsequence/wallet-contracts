// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;


contract GasEstimator {
  function estimate(
    address _to,
    bytes calldata _data
  ) external returns (bool success, bytes memory result, uint256 gas) {
    // solhint-disable
    uint256 initialGas = gasleft();
    (success, result) = _to.call(_data);
    gas = initialGas - gasleft();
    // solhint-enable
  }
}

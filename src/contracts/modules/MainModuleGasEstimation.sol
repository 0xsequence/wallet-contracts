// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "./commons/ModuleIgnoreAuthUpgradable.sol";
import "./commons/ModuleIgnoreNonceCalls.sol";
import "./commons/ModuleHooks.sol";
import "./commons/ModuleUpdate.sol";
import "./commons/ModuleCreator.sol";


/**
 * @notice Contains an alternative implementation of the MainModules that skips validation of
 *   signatures, this implementation SHOULD NOT be used directly on a wallet.
 *
 *   Intended to be used only for gas estimation, using eth_call and overrides.
 */
contract MainModuleGasEstimation is
  ModuleIgnoreAuthUpgradable,
  ModuleIgnoreNonceCalls,
  ModuleUpdate,
  ModuleHooks,
  ModuleCreator
{
  struct SimulateResult {
    bool executed;
    bool succeeded;
    bytes result;
    uint256 gasUsed;
  }

  /**
   * @notice Simulate each transaction in a bundle for gas usage and execution result
   * @param _txs Transactions to process
   * @return The gas used and execution result for each transaction in the bundle
   */
  function simulateExecute(Transaction[] calldata _txs) public virtual returns (SimulateResult[] memory) {
    SimulateResult[] memory results = new SimulateResult[](_txs.length);

    // Execute transaction
    for (uint256 i = 0; i < _txs.length; i++) {
      Transaction memory transaction = _txs[i];

      require(gasleft() >= transaction.gasLimit, "MainModuleGasEstimation#simulateExecute: NOT_ENOUGH_GAS");

      results[i].executed = true;

      if (transaction.delegateCall) {
        uint256 initialGas = gasleft();

        (results[i].succeeded, results[i].result) = transaction.target.delegatecall{
          gas: transaction.gasLimit == 0 ? gasleft() : transaction.gasLimit
        }(transaction.data);

        results[i].gasUsed = initialGas - gasleft();
      } else {
        uint256 initialGas = gasleft();

        (results[i].succeeded, results[i].result) = transaction.target.call{
          value: transaction.value,
          gas: transaction.gasLimit == 0 ? gasleft() : transaction.gasLimit
        }(transaction.data);

        results[i].gasUsed = initialGas - gasleft();
      }

      if (!results[i].succeeded && _txs[i].revertOnError) {
        break;
      }
    }

    return results;
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @dev If using a new main module, developpers must ensure that all inherited
   *      contracts by the mainmodule don't conflict and are accounted for to be
   *      supported by the supportsInterface method.
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(
    bytes4 _interfaceID
  ) public override(
    ModuleIgnoreAuthUpgradable,
    ModuleIgnoreNonceCalls,
    ModuleUpdate,
    ModuleHooks,
    ModuleCreator
  ) pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

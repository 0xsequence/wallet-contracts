// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./commons/gas-estimation/ModuleIgnoreAuthUpgradable.sol";
import "./commons/gas-estimation/ModuleIgnoreNonceCalls.sol";
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
    unchecked {
      SimulateResult[] memory results = new SimulateResult[](_txs.length);

      // Execute transaction
      uint256 size = _txs.length;
      for (uint256 i = 0; i < size; i++) {
        Transaction calldata transaction = _txs[i];
        uint256 gasLimit = transaction.gasLimit;

        results[i].executed = true;

        if (gasleft() < gasLimit) {
          results[i].succeeded = false;
          results[i].result = abi.encodeWithSelector(IModuleCalls.NotEnoughGas.selector, i, gasLimit, gasleft());
          break;
        }

        if (transaction.delegateCall) {
          uint256 initialGas = gasleft();

          (results[i].succeeded, results[i].result) = transaction.target.delegatecall{
            gas: gasLimit == 0 ? gasleft() : gasLimit
          }(transaction.data);

          results[i].gasUsed = initialGas - gasleft();
        } else {
          uint256 initialGas = gasleft();

          (results[i].succeeded, results[i].result) = transaction.target.call{
            value: transaction.value,
            gas: gasLimit == 0 ? gasleft() : gasLimit
          }(transaction.data);

          results[i].gasUsed = initialGas - gasleft();
        }

        if (!results[i].succeeded && transaction.revertOnError) {
          break;
        }
      }

      return results;
    }
  }

  function _isValidImage(bytes32 _imageHash) internal override(
    IModuleAuth,
    ModuleIgnoreAuthUpgradable
  ) view returns (bool) {
    return super._isValidImage(_imageHash);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @dev If using a new main module, developers must ensure that all inherited
   *      contracts by the main module don't conflict and are accounted for to be
   *      supported by the supportsInterface method.
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(
    bytes4 _interfaceID
  ) public override(
    ModuleAuthUpgradable,
    ModuleCalls,
    ModuleUpdate,
    ModuleHooks,
    ModuleCreator
  ) pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

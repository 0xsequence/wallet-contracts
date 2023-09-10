// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "../../modules/commons/interfaces/IModuleCalls.sol";
import "./IAccount.sol";

/**
 * An extension to EIP-4337 that includes a self execute function.
 */
interface IEIP4337Hook is IAccount {

  /**
   * @notice Allow wallet owner to execute an action.
   * @param _txs Transactions to process
   * @notice This functions is only callable by the Entrypoint.
   */
  function eip4337SelfExecute(
    IModuleCalls.Transaction[] calldata _txs
  ) external payable;

}
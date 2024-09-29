// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import {IEIP4337Hook, IAccount} from './interfaces/IEIP4337Hook.sol';
import {IERC1271Wallet} from '../interfaces/IERC1271Wallet.sol';
import {IModuleCalls} from '../modules/commons/interfaces/IModuleCalls.sol';

contract EIP4337Hook is IEIP4337Hook {
  address public immutable entrypoint;
  uint256 private constant SIG_VALIDATION_FAILED = 1;
  bytes4 private constant ERC1271_SELECTOR = 0x1626ba7e;

  /**
   * Create the EIP-4337 hook for the given entrypoint.
   */
  constructor(address _entrypoint) {
    entrypoint = _entrypoint;
  }

  modifier onlyEntrypoint() {
    if (msg.sender != entrypoint) {
      revert InvalidCaller();
    }
    _;
  }

  /**
   * Allow the EIP-4337 entrypoint to execute a transaction on the wallet.
   * @dev This function does not validate as the entrypoint is trusted to have called validateUserOp.
   * @notice This functions is only callable by the Entrypoint.
   */
  function eip4337SelfExecute(IModuleCalls.Transaction[] calldata txs) external payable onlyEntrypoint {
    // Self execute
    (bool success, bytes memory returndata) = payable(address(this)).call{value: msg.value}(
      abi.encodeWithSelector(IModuleCalls.selfExecute.selector, txs)
    );
    if (!success) {
      // Bubble up revert reason
      if (returndata.length == 0) {
        revert(); // solhint-disable-line reason-string
      }
      assembly {
        let returndata_size := mload(returndata)
        revert(add(32, returndata), returndata_size)
      }
    }
  }

  /**
   * Validate and pay for user op.
   * @dev This must be called by the entrypoint.
   * @dev GAS opcode is banned during this call, thus max uint256 is used.
   */
  function validateUserOp(
    IAccount.UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 missingAccountFunds
  ) external onlyEntrypoint returns (uint256 validationData) {
    // Check signature
    bytes32 ethHash = keccak256(abi.encodePacked('\x19Ethereum Signed Message:\n32', userOpHash));
    // solhint-disable-next-line avoid-low-level-calls
    (bool sigSuccess, bytes memory data) = address(this).call{gas: type(uint256).max}(
      abi.encodeWithSelector(ERC1271_SELECTOR, ethHash, userOp.signature)
    );
    if (!sigSuccess || bytes4(data) != ERC1271_SELECTOR) {
      // Failed to validate signature
      return SIG_VALIDATION_FAILED;
    }

    // Pay entrypoint
    if (missingAccountFunds != 0) {
      (bool success, ) = payable(msg.sender).call{value: missingAccountFunds, gas: type(uint256).max}('');
      (success);
    }

    // Success
    return 0;
  }
}

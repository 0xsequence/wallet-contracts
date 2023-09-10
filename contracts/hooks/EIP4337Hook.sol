// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import {IEIP4337Hook, IAccount} from './interfaces/IEIP4337Hook.sol';
import {IERC1271Wallet} from '../interfaces/IERC1271Wallet.sol';
import {IModuleCalls} from '../modules/commons/interfaces/IModuleCalls.sol';
import {ModuleNonce} from '../modules/commons/ModuleNonce.sol';
import {LibOptim} from '../utils/LibOptim.sol';

contract EIP4337Hook is IEIP4337Hook, ModuleNonce {
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
   * @dev Failure handling done by ModuleCalls.
   * @notice This functions is only callable by the Entrypoint.
   */
  function eip4337SelfExecute(IModuleCalls.Transaction[] calldata txs) external payable onlyEntrypoint {
    // Self execute
    (bool success, ) = payable(address(this)).call{value: msg.value}(
      abi.encodeWithSelector(IModuleCalls.selfExecute.selector, txs)
    );
    (success);
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
    // Check nonce.
    // Note Sequence space encoding is diff to EIP-4337 encoding.
    _validateNonce(userOp.nonce);

    // Check signature
    bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash));
    (bool sigSuccess, bytes memory data) = address(this).call{gas: type(uint256).max}(
      abi.encodeWithSelector(ERC1271_SELECTOR, ethHash, userOp.signature)
    );
    if (!sigSuccess || bytes4(data) != ERC1271_SELECTOR) {
      // Failed to validate signature
      return SIG_VALIDATION_FAILED;
    }

    // Pay entrypoint
    if (missingAccountFunds != 0) {
      (bool success,) = payable(msg.sender).call{value: missingAccountFunds, gas: type(uint256).max}('');
      (success);
    }

    // Success
    return 0;
  }
}

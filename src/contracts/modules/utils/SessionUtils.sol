// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "./commons/GapNonceUtils.sol";
import "./commons/NonceResetUtils.sol";

import "../commons/ModuleERC165.sol";
import "../commons/interfaces/IModuleAuthUpgradable.sol";


contract SessionUtils is GapNonceUtils, NonceResetUtils {
  //                       SESSION_SPACE = bytes32(uint256(uint160(bytes20(keccak256("org.sequence.sessions.space")))));
  //                                     = 0x96f7fef04d2478e2b011c3aca79dc5a83b5d37ef
  uint256 private constant SESSION_SPACE = 861879107978547650890364157709704413515112855535;

  /**
   * @notice Enforces the order of execution for pre-signed session transactions.
   * @dev It uses gap nonce instead of regular nonces, so the order is guaranteed but transactions can be skipped.
   * @param _nonce The gap nonce of the transaction.
   */
  function requireSessionNonce(uint256 _nonce) external {
    // Require gap nonce
    _requireGapNonce(SESSION_SPACE, _nonce);

    // Reset regular nonce
    _resetNonce(SESSION_SPACE);
  
    // Should support AuthModuleUpgradable
    // otherwise the wallet wasn't upgraded
    require(
      ModuleERC165(address(this)).supportsInterface(type(IModuleAuthUpgradable).interfaceId),
      "SessionUtils#requireSessionNonce: WALLET_NOT_UPGRADED"
    );
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;

import "./commons/GapNonceUtils.sol";
import "./commons/NonceResetUtils.sol";


contract SessionUtils is GapNonceUtils, NonceResetUtils {
  //                       SESSION_SPACE = bytes20(keccak256("org.sequence.sessions.space"));
  uint256 private constant SESSION_SPACE = uint256(bytes32(bytes20(keccak256("org.sequence.sessions.space"))));

  function requireSessionNonce(uint256 _nonce) external {
    // Require gap nonce
    _requireGapNonce(SESSION_SPACE, _nonce);

    // Reset regular nonce
    _resetNonce(SESSION_SPACE);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;

import "./commons/GapNonceUtils.sol";
import "./commons/NonceResetUtils.sol";


contract SessionUtils is GapNonceUtils, NonceResetUtils {
  //                       SESSION_SPACE = bytes32(uint256(uint160(bytes20(keccak256("org.sequence.sessions.space")))));
  //                                     = 0x96f7fef04d2478e2b011c3aca79dc5a83b5d37ef
  uint256 private constant SESSION_SPACE = 861879107978547650890364157709704413515112855535;

  function requireSessionNonce(uint256 _nonce) external {
    // Require gap nonce
    _requireGapNonce(SESSION_SPACE, _nonce);

    // Reset regular nonce
    _resetNonce(SESSION_SPACE);
  }
}

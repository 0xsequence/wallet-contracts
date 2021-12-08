// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;

import "../modules/utils/commons/GapNonceUtils.sol";


contract ReadGapNonceHook is GapNonceUtils {
  function readGapNonce(uint256 _space) external view returns (uint256) {
      return _readGapNonce(_space);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;

import "../RequireUtils.sol";


contract RequireFreshSigner {
  RequireUtils public immutable REQUIRE_UTILS;

  constructor (RequireUtils _requireUtils) {
    REQUIRE_UTILS = _requireUtils;
  }

  function requireFreshSigner(address _signer) external {
    require(REQUIRE_UTILS.lastSignerUpdate(_signer) == 0, "RequireFreshSigner#requireFreshSigner: DUPLICATED_SIGNER");
  }
}

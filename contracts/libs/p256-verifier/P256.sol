// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


/**
 * Helper library for external contracts to verify P256 signatures.
 * Provided by: https://github.com/daimo-eth/p256-verifier
 **/
library P256 {
  address internal constant VERIFIER = 0xc2b78104907F722DABAc4C69f826a522B2754De4;

  function verifySignature(
    bytes32 message_hash,
    uint256 r,
    uint256 s,
    uint256 x,
    uint256 y
  ) internal view returns (bool) {
    bytes memory args = abi.encode(message_hash, r, s, x, y);
    (bool success, bytes memory ret) = VERIFIER.staticcall(args);
    assert(success); // never reverts, always returns 0 or 1

    return abi.decode(ret, (uint256)) == 1;
  }
}

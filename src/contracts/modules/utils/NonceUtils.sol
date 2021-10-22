// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;


contract NonceUtils {
  mapping (address => uint256) public nonces;

  function requireGapNonce(uint256 _nonce) external {
    require(nonces[msg.sender] < _nonce, "NonceUtils#requireGapNonce: INVALID_NONCE");
    nonces[msg.sender] = _nonce;
  }
}

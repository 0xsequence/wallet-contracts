// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/modules/commons/submodules/nonce/SubModuleNonce.sol";

import "foundry_test/base/AdvTest.sol";


contract SubModuleNonceTest is AdvTest {
  function test_decodeNonce(uint160 _space, uint96 _nonce) external {
    uint256 encoded = abi.decode(abi.encodePacked(_space, _nonce), (uint256));
    (uint256 space2, uint256 nonce2) = SubModuleNonce.decodeNonce(encoded);

    assertEq(space2, _space);
    assertEq(nonce2, _nonce);
  }
}

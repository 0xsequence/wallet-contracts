// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "contracts/modules/commons/submodules/nonce/SubModuleNonce.sol";

import "foundry_test/base/AdvTest.sol";


contract SubModuleNonceTest is AdvTest {
  function test_decodeNonce(uint160 _space, uint8 _type, uint88 _nonce) external {
    _type = uint8(bound(_type, SubModuleNonce.TypeNormalNonce, SubModuleNonce.TypeNoNonce));

    uint256 encoded = abi.decode(abi.encodePacked(_space, _type, _nonce), (uint256));
    (uint256 space2, uint256 type2, uint256 nonce2) = SubModuleNonce.decodeNonce(encoded);

    assertEq(space2, _space);
    assertEq(type2, _type);
    assertEq(nonce2, _nonce);
  }

  function test_decodeNonce_Fail_InvalidType(uint160 _space, uint8 _type, uint88 _nonce) external {
    _type = uint8(boundDiff(_type, SubModuleNonce.TypeNormalNonce, SubModuleNonce.TypeGapNonce, SubModuleNonce.TypeNoNonce));

    uint256 encoded = abi.decode(abi.encodePacked(_space, _type, _nonce), (uint256));
    vm.expectRevert(abi.encodeWithSignature('InvalidNonceType(uint256)', _type));
    SubModuleNonce.decodeNonce(encoded);
  }
}

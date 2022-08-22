// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "contracts/modules/commons/submodules/auth/SequenceBaseSig.sol";
import "contracts/modules/commons/submodules/auth/SequenceDynamicSig.sol";

import "foundry_test/base/AdvTest.sol";


contract SequenceDynamicSigImp {
  function recover(bytes32 _subDigest, bytes calldata _signature) external view returns (uint256, uint256, bytes32) {
    return SequenceDynamicSig.recover(_subDigest, _signature);
  }

  function recoverBase(bytes32 _subDigest, bytes calldata _signature) external view returns (uint256 threshold, uint256 weight, bytes32 imageHash) {
    return SequenceBaseSig.recover(_subDigest, _signature);
  }
}

contract SequenceDynamicSigTest is AdvTest {
  SequenceDynamicSigImp private lib;

  function setUp() public {
    lib = new SequenceDynamicSigImp();
  }

  function test_recover_ignoreFirstByte(uint8 _first, bytes32 _subdigest, uint256 _pk, uint16 _threshold, uint8 _weight) external {
    _pk = boundPk(_pk);

    bytes memory signature = signAndPack(_pk, _subdigest, 1);
    bytes memory encoded = abi.encodePacked(_threshold, uint8(0), _weight, signature);

    (uint256 threshold1, uint256 weight1, bytes32 imageHash1) = lib.recover(_subdigest, abi.encodePacked(_first, encoded));
    (uint256 threshold2, uint256 weight2, bytes32 imageHash2) = lib.recoverBase(_subdigest, encoded);

    assertEq(threshold1, threshold2);
    assertEq(weight1, weight2);
    assertEq(imageHash1, imageHash2);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/modules/commons/ModuleExtraAuth.sol";

import "foundry_test/base/AdvTest.sol";


abstract contract ModuleAuthImp is IModuleAuth {
  mapping(bytes32 => bool) private imageHashToIsValid;

  function setValidImageHash(bytes32 _imageHash, bool _isValid) external {
    imageHashToIsValid[_imageHash] = _isValid;
  }

  function _isValidImage(bytes32 _imageHash) internal override virtual view returns (bool) {
    return imageHashToIsValid[_imageHash];
  }
}

contract ModuleExtraAuthImp2 is ModuleAuthImp, ModuleExtraAuth {
  function _isValidImage(bytes32 _imageHash) internal override(
    ModuleAuthImp,
    ModuleExtraAuth
  ) view returns (bool) {
    return super._isValidImage(_imageHash);
  }

  function isValidImage(bytes32 _imageHash) external view returns (bool) {
    return _isValidImage(_imageHash);
  }

  function _updateImageHash(bytes32) internal override virtual {
    revert('not implemented');
  }
}

contract ModuleExtraAuthTest is AdvTest {
  ModuleExtraAuthImp2 private imp;

  function setUp() public {
    imp = new ModuleExtraAuthImp2();
  }

  event SetExtraImageHash(bytes32 indexed _imageHash, uint256 _expiration);

  function test_shouldAcceptExtraImageHashes(
    bytes32 _imageHashb,
    bytes32 _imageHash1,
    bytes32 _imageHash2,
    uint256 _expiration1,
    uint256 _expiration2
  ) external {
    _expiration1 = bound(_expiration1, block.timestamp + 1, type(uint256).max);
    _expiration2 = bound(_expiration2, block.timestamp + 1, type(uint256).max);

    assertFalse(imp.isValidImage(_imageHashb));
    assertFalse(imp.isValidImage(_imageHash1));
    assertFalse(imp.isValidImage(_imageHash2));

    imp.setValidImageHash(_imageHashb, true);
    assertTrue(imp.isValidImage(_imageHashb));
    assertEq(imp.isValidImage(_imageHash1), _imageHash1 == _imageHashb);
    assertEq(imp.isValidImage(_imageHash2), _imageHash2 == _imageHashb);

    vm.prank(address(imp));
    vm.expectEmit(true, true, true, true, address(imp));
    emit SetExtraImageHash(_imageHash1, _expiration1);
    imp.setExtraImageHash(_imageHash1, _expiration1);

    assertTrue(imp.isValidImage(_imageHash1));
    assertEq(imp.isValidImage(_imageHash2), _imageHash1 == _imageHash2 || _imageHashb == _imageHash2);
    assertTrue(imp.isValidImage(_imageHashb));

    vm.prank(address(imp));
    vm.expectEmit(true, true, true, true, address(imp));
    emit SetExtraImageHash(_imageHash2, _expiration2);
    imp.setExtraImageHash(_imageHash2, _expiration2);

    assertTrue(imp.isValidImage(_imageHashb));
    assertTrue(imp.isValidImage(_imageHash1));
    assertTrue(imp.isValidImage(_imageHash2));
  }

  function test_shouldRejectExpiredImageHash(
    bytes32 _imageHashb,
    bytes32 _imageHash1,
    bytes32 _imageHash2,
    uint256 _expiration1,
    uint256 _expiration2
  ) external {
    _expiration1 = bound(_expiration1, block.timestamp + 1, type(uint256).max);
    _expiration2 = bound(_expiration2, 0,  block.timestamp);

    imp.setValidImageHash(_imageHashb, true);

    vm.prank(address(imp));
    vm.expectEmit(true, true, true, true, address(imp));
    emit SetExtraImageHash(_imageHash1, _expiration1);
    imp.setExtraImageHash(_imageHash1, _expiration1);

    vm.prank(address(imp));
    vm.expectEmit(true, true, true, true, address(imp));
    emit SetExtraImageHash(_imageHash2, _expiration2);
    imp.setExtraImageHash(_imageHash2, _expiration2);

    assertTrue(imp.isValidImage(_imageHashb));
    assertEq(imp.isValidImage(_imageHash1), _imageHash1 != _imageHash2 || _imageHash1 == _imageHashb);
    assertEq(imp.isValidImage(_imageHash2), _imageHash2 == _imageHashb);
  }

  struct SetIh {
    bytes32 imageHash;
    uint256 expiration;
  }

  mapping(bytes32 => bool) private wasCleared;

  function test_shouldClearExtraImageHashes(
    bytes32 _base,
    SetIh[] calldata _set,
    bytes32[] calldata _clear
  ) external {
    uint256 sizeSet = mayBoundArr(_set.length);
    uint256 sizeClear = mayBoundArr(_clear.length);

    imp.setValidImageHash(_base, true);

    vm.startPrank(address(imp));
    for (uint256 i = 0; i < sizeSet; i++) {
      uint256 expiration = bound(_set[i].expiration, block.timestamp + 1, type(uint256).max);
      imp.setExtraImageHash(_set[i].imageHash, expiration);
    }

    bytes32[] memory toClear = new bytes32[](sizeClear);
    for (uint256 i = 0; i < sizeClear; i++) {
      toClear[i] = _clear[i];
    }

    imp.clearExtraImageHashes(toClear);

    for (uint256 i = 0; i < sizeClear; i++) {
      assertEq(imp.isValidImage(_clear[i]), _clear[i] == _base);
      wasCleared[_clear[i]] = true;
    }

    for (uint256 i = 0; i < sizeSet; i++) {
      assertEq(
        imp.isValidImage(_set[i].imageHash),
        _set[i].imageHash == _base || !wasCleared[_set[i].imageHash]
      );
    }
  }

  function test_fail_setExtraImageHash_notSelf(
    address _caller,
    bytes32 _imageHash,
    uint256 _expiration
  ) external {
    boundDiff(_caller, address(imp));
    vm.expectRevert(abi.encodeWithSignature('OnlySelfAuth(address,address)', _caller, address(imp)));
    vm.prank(_caller);
    imp.setExtraImageHash(_imageHash, _expiration);
  }

  function test_fail_clearExtraImageHash_notSelf(
    address _caller,
    bytes32[] calldata _clear
  ) external {
    boundDiff(_caller, address(imp));
    vm.expectRevert(abi.encodeWithSignature('OnlySelfAuth(address,address)', _caller, address(imp)));
    vm.prank(_caller);
    imp.clearExtraImageHashes(_clear);
  }
}

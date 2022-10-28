// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;

import "contracts/modules/commons/ModuleStaticAuth.sol";

import "foundry_test/base/AdvTest.sol";


abstract contract ModuleAuthImp is IModuleAuth {
  mapping(bytes32 => bool) private imageHashToIsValid;

  function setValidImageHash(bytes32 _imageHash, bool _isValid) external {
    imageHashToIsValid[_imageHash] = _isValid;
  }

  function _isValidImage(bytes32 _imageHash) internal override virtual view returns (bool) {
    return imageHashToIsValid[_imageHash];
  }

  function signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) external view returns (
    bool isValid,
    bytes32 subDigest
  ) {
    return _signatureValidation(_digest, _signature);
  }
}

contract ModuleStaticAuthImp is ModuleAuthImp, ModuleStaticAuth {
  function _isValidImage(bytes32 _imageHash) internal override(
    IModuleAuth,
    ModuleAuthImp
  ) view returns (bool) {
    return super._isValidImage(_imageHash);
  }

  function _updateImageHash(bytes32) internal override virtual {
    revert('not implemented');
  }
}

contract ModuleStaticAuthTest is AdvTest {
  ModuleStaticAuthImp private imp;

  event SetStaticDigest(bytes32 indexed _digest, uint256 _expiration);
  bytes32 private constant STATIC_DIGEST_HASH_KEY = bytes32(0x7f25a23abc421d10864063e9a8ae5fd3fbd5116e156f148428b6a3a02ffd9454);

  function setUp() external {
    imp = new ModuleStaticAuthImp();
  }

  function _buildSignature(
    bytes32[] calldata _witnesses
  ) internal returns (bytes memory) {
    return _buildSignatureWithPrefix(hex'000000000000', _witnesses);
  }

  function _buildSignatureWithPrefix(
    bytes memory _prefix,
    bytes32[] calldata _witnesses
  ) internal returns (bytes memory) {
    bytes memory sig = abi.encodePacked(_prefix);

    uint256 witnessesLength = mayBoundArr(_witnesses.length);
    witnessesLength = bound(witnessesLength, 0, 64);

    for (uint i = 0; i < witnessesLength; i++) {
      sig = abi.encodePacked(sig, uint8(3), _witnesses[i]);
    }

    return sig;
  }

  function test_setStaticDigest(
    bytes32 _digest,
    bytes32[] calldata _signatureWitnesses,
    uint256 _expiration
  ) external {
    _expiration = bound(_expiration, block.timestamp + 1, type(uint256).max);

    vm.expectEmit(true, true, true, true, address(imp));
    emit SetStaticDigest(_digest, _expiration);
    vm.prank(address(imp));

    imp.setStaticDigest(_digest, _expiration);
    assertEq(imp.staticDigest(_digest), _expiration);

    bytes32 staticSubdigest = keccak256(
      abi.encodePacked(
        STATIC_DIGEST_HASH_KEY,
        _digest
      )
    );

    bytes memory signature = _buildSignature(_signatureWitnesses);
    (bool isValid, bytes32 resSubdigest) = imp.signatureValidation(_digest, signature);
    assertTrue(isValid);
    assertEq(resSubdigest, staticSubdigest);

    bytes memory belowThresholdSignature = _buildSignatureWithPrefix(hex'00ff703708f3', _signatureWitnesses);
    (isValid, resSubdigest) = imp.signatureValidation(_digest, belowThresholdSignature);

    assertTrue(isValid);
    assertEq(resSubdigest, staticSubdigest);
  }

  function test_addStaticDigests(
    bytes32[] calldata _digests,
    bytes32[] calldata _signatureWitnesses
  ) external {
    uint256 digestsSize = mayBoundArr(_digests.length);

    digestsSize = bound(digestsSize, 0, 64);

    bytes32[] memory digests = new bytes32[](digestsSize);

    for (uint i = 0; i < digestsSize; i++) {
      digests[i] = _digests[i];
      vm.expectEmit(true, true, true, true, address(imp));
      emit SetStaticDigest(_digests[i], type(uint256).max);
    }

    vm.prank(address(imp));
    imp.addStaticDigests(digests);

    for (uint i = 0; i < digestsSize; i++) {
      bytes32 digest = digests[i];

      assertEq(imp.staticDigest(digest), type(uint256).max);

      bytes32 staticSubdigest = keccak256(
        abi.encodePacked(
          STATIC_DIGEST_HASH_KEY,
          digest
        )
      );

      bytes memory signature = _buildSignature(_signatureWitnesses);
      (bool isValid, bytes32 resSubdigest) = imp.signatureValidation(digest, signature);
      assertTrue(isValid);
      assertEq(resSubdigest, staticSubdigest);

      bytes memory belowThresholdSignature = _buildSignatureWithPrefix(hex'00ff703708f3', _signatureWitnesses);
      (isValid, resSubdigest) = imp.signatureValidation(digest, belowThresholdSignature);

      assertTrue(isValid);
      assertEq(resSubdigest, staticSubdigest);
    }
  }

  function test_clearStaticDigest(
    bytes32 _set1,
    bytes32 _set2,
    uint256 _firstTimestamp1,
    uint256 _firstTimestamp2,
    uint256 _clearTimestamp1,
    bytes32[] calldata _signatureWitnesses
  ) external {
    _firstTimestamp1 = bound(_firstTimestamp1, block.timestamp + 1, type(uint256).max);
    _firstTimestamp2 = bound(_firstTimestamp2, block.timestamp + 1, type(uint256).max);
    _clearTimestamp1 = bound(_clearTimestamp1, 0, block.timestamp);

    vm.startPrank(address(imp));
    imp.setStaticDigest(_set1, _firstTimestamp1);
    imp.setStaticDigest(_set2, _firstTimestamp2);
    vm.stopPrank();

    assertEq(imp.staticDigest(_set1), _set1 != _set2 ? _firstTimestamp1 : _firstTimestamp2);
    assertEq(imp.staticDigest(_set2), _firstTimestamp2);

    vm.expectEmit(true, true, true, true, address(imp));
    emit SetStaticDigest(_set1, _clearTimestamp1);
    vm.prank(address(imp));
    imp.setStaticDigest(_set1, _clearTimestamp1);

    assertEq(imp.staticDigest(_set1), _clearTimestamp1);
    assertEq(imp.staticDigest(_set2), _set1 != _set2 ? _firstTimestamp2 : _clearTimestamp1);

    bytes32 subDigest1 = keccak256(
      abi.encodePacked(
        "\x19\x01",
        block.chainid,
        address(imp),
        _set1
      )
    );

    bytes32 staticSubdigest2 = keccak256(
      abi.encodePacked(
        STATIC_DIGEST_HASH_KEY,
        _set2
      )
    );

    bytes memory signature = _buildSignature(_signatureWitnesses);
    (bool isValid, bytes32 resSubdigest) = imp.signatureValidation(_set1, signature);
    assertFalse(isValid);
    assertEq(resSubdigest, subDigest1);

    bytes memory belowThresholdSignature = _buildSignatureWithPrefix(hex'00ff703708f3', _signatureWitnesses);
    (isValid, resSubdigest) = imp.signatureValidation(_set1, belowThresholdSignature);
    assertFalse(isValid);
    assertEq(resSubdigest, subDigest1);

    (isValid, resSubdigest) = imp.signatureValidation(_set2, signature);
    assertEq(isValid, _set1 != _set2);
    assertEq(resSubdigest, _set1 != _set2 ? staticSubdigest2 : subDigest1);

    (isValid, resSubdigest) = imp.signatureValidation(_set2, belowThresholdSignature);
    assertEq(isValid, _set1 != _set2);
    assertEq(resSubdigest, _set1 != _set2 ? staticSubdigest2 : subDigest1);
  }

  function test_fail_setStaticDigest_NotSelf(
    address _notself,
    bytes32 _digest,
    uint256 _expiration
  ) external {
    _notself = boundDiff(_notself, address(imp));

    vm.expectRevert(abi.encodeWithSignature('OnlySelfAuth(address,address)', _notself, address(imp)));
    vm.prank(_notself);
    imp.setStaticDigest(_digest, _expiration);
  }

  function test_fail_addStaticDigests_NotSelf(
    address _notself,
    bytes32[] calldata _digests
  ) external {
    _notself = boundDiff(_notself, address(imp));

    vm.expectRevert(abi.encodeWithSignature('OnlySelfAuth(address,address)', _notself, address(imp)));
    vm.prank(_notself);
    imp.addStaticDigests(_digests);
  }
}

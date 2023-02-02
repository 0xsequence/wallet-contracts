// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/modules/commons/submodules/auth/SequenceChainedSig.sol";

import "foundry_test/base/AdvTest.sol";


contract SequenceChainedSigImp is SequenceChainedSig {
  function pchainedRecover(bytes32 _digest, bytes calldata _signature) external view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subdigest,
    uint256 checkpoint
  ) {
    return chainedRecover(_digest, _signature);
  }

  struct MockedSignature {
    bool exists;
    uint256 threshold;
    uint256 weight;
    bytes32 imageHash;
    bytes32 subdigest;
    uint256 checkpoint;
  }

  mapping(bytes32 => mapping(bytes => MockedSignature)) public mockedSignatures;

  function isMocked(bytes32 _digest, bytes calldata _signature) external view returns (bool) {
    return mockedSignatures[_digest][_signature].exists;
  }

  function mockSignature(
    bytes32 _digest,
    bytes calldata _signature,
    uint256 _threshold,
    uint256 _weight,
    bytes32 _imageHash,
    bytes32 _subdigest,
    uint256 _checkpoint
  ) external {
    MockedSignature memory sig;

    sig.exists = true;
    sig.threshold = _threshold;
    sig.weight = _weight;
    sig.imageHash = _imageHash;
    sig.subdigest = _subdigest;
    sig.checkpoint = _checkpoint;

    mockedSignatures[_digest][_signature] = sig;
  }

  function signatureRecovery(
    bytes32 _digest,
    bytes calldata _signature
  ) public override view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subdigest,
    uint256 checkpoint
  ) {
    if (mockedSignatures[_digest][_signature].exists) {
      return (
        mockedSignatures[_digest][_signature].threshold,
        mockedSignatures[_digest][_signature].weight,
        mockedSignatures[_digest][_signature].imageHash,
        mockedSignatures[_digest][_signature].subdigest,
        mockedSignatures[_digest][_signature].checkpoint
      );
    } else {
      revert('invalid mocked signature');
    }
  }

  function hashSetImageHashStruct(bytes32 _imageHash) external pure returns (bytes32) {
    return _hashSetImageHashStruct(_imageHash);
  }

  function _signatureValidation(
    bytes32,
    bytes calldata
  ) internal override pure returns (
    bool, bytes32
  ) {
    revert('not implemented');
  }

  function _isValidImage(bytes32) internal override pure returns (bool) {
    revert('not implemented');
  }

  function updateImageHash(bytes32) external pure override {
    revert('not implemented');
  }

  function _updateImageHash(bytes32) internal pure override {
    revert('not implemented');
  }
}

contract SequenceChainedSigTest is AdvTest {
  SequenceChainedSigImp private lib;

  function setUp() public {
    lib = new SequenceChainedSigImp();
  }

  struct HashAndSignature {
    bytes32 imageHash;
    uint256 threshold;
    uint256 weight;
    uint56 checkpointDelta;
    bytes signature;
  }

  function test_chainedRecover(uint8 _prefix, bytes32 _digest, HashAndSignature[] memory _steps) external {
    vm.assume(_steps.length > 0);

    bytes memory signature = abi.encodePacked(_prefix);

    uint256 size = boundDiff(mayBoundArr(_steps.length), 0);

    bytes32 nextDigest = _digest;
    uint32 checkpoint = type(uint32).max;

    for (uint256 i = 0; i < size; i++) {
      _steps[i].weight = bound(_steps[i].weight, _steps[i].threshold, type(uint256).max);

      if (i != 0) {
        checkpoint -= uint32(bound(_steps[i].checkpointDelta, 1, type(uint24).max));
      }

      if (lib.isMocked(nextDigest, _steps[i].signature)) {
        _steps[i].signature = abi.encodePacked(_steps[i].signature, _steps[i].imageHash);
      }

      lib.mockSignature(
        nextDigest,
        _steps[i].signature,
        _steps[i].threshold,
        _steps[i].weight,
        _steps[i].imageHash,
        i == 0 ? _digest : nextDigest,
        checkpoint
      );

      nextDigest = lib.hashSetImageHashStruct(_steps[i].imageHash);
      signature = abi.encodePacked(signature, uint24(_steps[i].signature.length), _steps[i].signature);
    }

    (uint256 threshold, uint256 weight, bytes32 imageHash, bytes32 subdigest, uint256 rcheckpoint) = lib.pchainedRecover(_digest, signature);

    assertEq(imageHash, _steps[size - 1].imageHash);
    assertEq(threshold, _steps[size - 1].threshold);
    assertEq(weight, _steps[size - 1].weight);
    assertEq(subdigest, _digest);
    assertEq(rcheckpoint, checkpoint);
  }

  function test_chainedRecover_Fail_LowWeight(uint8 _prefix, uint256 _badi, bytes32 _digest, HashAndSignature[] memory _steps) external {
    vm.assume(_steps.length > 0);

    bytes memory signature = abi.encodePacked(_prefix);

    uint256 size = boundDiff(mayBoundArr(_steps.length), 0);
    _badi = bound(_badi, 0, size - 1);

    bytes32 nextDigest = _digest;
    uint64 checkpoint = type(uint64).max;

    for (uint256 i = 0; i < size; i++) {
      if (i == _badi) {
        _steps[i].threshold = bound(_steps[i].threshold, 1, type(uint256).max);
        _steps[i].weight = bound(_steps[i].weight, 0, _steps[i].threshold - 1);
      } else {
        _steps[i].weight = bound(_steps[i].weight, _steps[i].threshold, type(uint256).max);
      }

      if (i != 0) {
        checkpoint -= uint64(bound(_steps[i].checkpointDelta, 1, type(uint56).max));
      }

      if (lib.isMocked(nextDigest, _steps[i].signature)) {
        _steps[i].signature = abi.encodePacked(_steps[i].signature, _steps[i].imageHash);
      }

      lib.mockSignature(
        nextDigest,
        _steps[i].signature,
        _steps[i].threshold,
        _steps[i].weight,
        _steps[i].imageHash,
        i == 0 ? _digest : nextDigest,
        checkpoint
      );

      nextDigest = lib.hashSetImageHashStruct(_steps[i].imageHash);
      signature = abi.encodePacked(signature, uint24(_steps[i].signature.length), _steps[i].signature);
    }

    vm.expectRevert(abi.encodeWithSignature('LowWeightChainedSignature(bytes,uint256,uint256)', _steps[_badi].signature, _steps[_badi].threshold, _steps[_badi].weight));
    lib.pchainedRecover(_digest, signature);
  }

  function test_chainedRecover_Fail_Checkpoint(uint8 _prefix, uint256 _badi, bytes32 _digest, HashAndSignature[] memory _steps) external {
    vm.assume(_steps.length >= 1);

    bytes memory signature = abi.encodePacked(_prefix);

    uint256 size = boundDiff(mayBoundArr(_steps.length), 0);
    _badi = bound(_badi, 0, size - 1);

    bytes32 nextDigest = _digest;
    uint64 checkpoint = type(uint64).max;

    uint64 badCheckpoint;
    uint64 prevToBadCheckpoint;

    for (uint256 i = 0; i < size; i++) {
      _steps[i].weight = bound(_steps[i].weight, _steps[i].threshold, type(uint256).max);

      if (i != 0) {
        if (_badi == i) {
          prevToBadCheckpoint = checkpoint;
          checkpoint = uint64(bound(uint256(checkpoint) + _steps[i].checkpointDelta, checkpoint, type(uint64).max));
          badCheckpoint = checkpoint;
        } else {
          checkpoint -= uint64(bound(_steps[i].checkpointDelta, 1, type(uint56).max));
        }
      }

      if (lib.isMocked(nextDigest, _steps[i].signature)) {
        _steps[i].signature = abi.encodePacked(_steps[i].signature, _steps[i].imageHash);
      }

      lib.mockSignature(
        nextDigest,
        _steps[i].signature,
        _steps[i].threshold,
        _steps[i].weight,
        _steps[i].imageHash,
        i == 0 ? _digest : nextDigest,
        checkpoint
      );

      nextDigest = lib.hashSetImageHashStruct(_steps[i].imageHash);
      signature = abi.encodePacked(signature, uint24(_steps[i].signature.length), _steps[i].signature);
    }

    if (_badi != 0) {
      vm.expectRevert(abi.encodeWithSignature('WrongChainedCheckpointOrder(uint256,uint256)', badCheckpoint, prevToBadCheckpoint));
    }

    lib.pchainedRecover(_digest, signature);
  }

  function test_chainedRecover_Fail_EmptySignature(bytes32 _digest) external {
    vm.expectRevert();
    lib.pchainedRecover(_digest, bytes(''));
  }
}

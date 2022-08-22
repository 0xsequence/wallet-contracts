// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "contracts/modules/commons/submodules/auth/SequenceChainedSig.sol";

import "foundry_test/base/AdvTest.sol";


contract SequenceChainedSigImp is SequenceChainedSig {
  function pchainedRecover(bytes32 _digest, bytes calldata _signature) external view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subDigest
  ) {
    return chainedRecover(_digest, _signature);
  }

  struct MockedSignature {
    bool exists;
    uint256 threshold;
    uint256 weight;
    bytes32 imageHash;
    bytes32 subDigest;
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
    bytes32 _subDigest
  ) external {
    MockedSignature memory sig;

    sig.exists = true;
    sig.threshold = _threshold;
    sig.weight = _weight;
    sig.imageHash = _imageHash;
    sig.subDigest = _subDigest;

    mockedSignatures[_digest][_signature] = sig;
  }

  function signatureRecovery(
    bytes32 _digest,
    bytes calldata _signature
  ) public override view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subDigest
  ) {
    if (mockedSignatures[_digest][_signature].exists) {
      return (
        mockedSignatures[_digest][_signature].threshold,
        mockedSignatures[_digest][_signature].weight,
        mockedSignatures[_digest][_signature].imageHash,
        mockedSignatures[_digest][_signature].subDigest
      );
    } else {
      revert('invalid signature');
    }
  }

  function hashSetImagehashStruct(bytes32 _imageHash, uint256 _checkpoint) external pure returns (bytes32) {
    return _hashSetImagehashStruct(_imageHash, _checkpoint);
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
}

contract SequenceChainedSigTest is AdvTest {
  SequenceChainedSigImp private lib;

  function setUp() public {
    lib = new SequenceChainedSigImp();
  }

  event SetLastCheckpoint(uint256 _checkpoint);

  function test_setLastAuthCheckpoint(uint256 _newCheckpoint1, uint256 _newCheckpoint2) external {
    vm.startPrank(address(lib));

    vm.expectEmit(true, true, true, true, address(lib));
    emit SetLastCheckpoint(_newCheckpoint1);
    lib.setLastAuthCheckpoint(_newCheckpoint1);
    assertEq(lib.getLastAuthCheckpoint(), _newCheckpoint1);

    vm.expectEmit(true, true, true, true, address(lib));
    emit SetLastCheckpoint(_newCheckpoint2);
    lib.setLastAuthCheckpoint(_newCheckpoint2);
    assertEq(lib.getLastAuthCheckpoint(), _newCheckpoint2);
  }

  function test_setLastAuthCheckpoint_Fail_NotSelf(address _from, uint256 _checkpoint) external {
    _from = boundDiff(_from, address(lib));

    vm.prank(_from);
    vm.expectRevert(abi.encodeWithSignature("OnlySelfAuth(address,address)", _from, address(lib)));
    lib.setLastAuthCheckpoint(_checkpoint);
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
    uint64 checkpoint = type(uint64).max;

    for (uint256 i = 0; i < size; i++) {
      _steps[i].weight = bound(_steps[i].weight, _steps[i].threshold, type(uint256).max);

      if (i != 0) {
        signature = abi.encodePacked(signature, checkpoint);
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
        i == 0 ? _digest : nextDigest
      );

      nextDigest = lib.hashSetImagehashStruct(_steps[i].imageHash, checkpoint);
      signature = abi.encodePacked(signature, uint16(_steps[i].signature.length), _steps[i].signature);
    }

    vm.prank(address(lib));
    lib.setLastAuthCheckpoint(checkpoint);

    (uint256 threshold, uint256 weight, bytes32 imageHash, bytes32 subDigest) = lib.pchainedRecover(_digest, signature);

    assertEq(imageHash, _steps[size - 1].imageHash);
    assertEq(threshold, _steps[size - 1].threshold);
    assertEq(weight, _steps[size - 1].weight);
    assertEq(subDigest, _digest);
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
        signature = abi.encodePacked(signature, checkpoint);
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
        i == 0 ? _digest : nextDigest
      );

      nextDigest = lib.hashSetImagehashStruct(_steps[i].imageHash, checkpoint);
      signature = abi.encodePacked(signature, uint16(_steps[i].signature.length), _steps[i].signature);
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
        signature = abi.encodePacked(signature, checkpoint);

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
        i == 0 ? _digest : nextDigest
      );

      nextDigest = lib.hashSetImagehashStruct(_steps[i].imageHash, checkpoint);
      signature = abi.encodePacked(signature, uint16(_steps[i].signature.length), _steps[i].signature);
    }

    vm.prank(address(lib));
    lib.setLastAuthCheckpoint(checkpoint);

    if (_badi != 0) {
      if (_badi == size - 1) {
        vm.expectRevert(abi.encodeWithSignature('WrongFinalCheckpoint(uint256,uint256)', prevToBadCheckpoint, checkpoint));
      } else {
        vm.expectRevert(abi.encodeWithSignature('WrongChainedCheckpointOrder(uint256,uint256)', badCheckpoint, prevToBadCheckpoint));
      }
    }

    lib.pchainedRecover(_digest, signature);
  }

  function test_chainedRecover_Fail_EmptySignature(bytes32 _digest) external {
    vm.expectRevert();
    lib.pchainedRecover(_digest, bytes(''));
  }
}

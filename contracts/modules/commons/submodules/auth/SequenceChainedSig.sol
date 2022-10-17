// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;

import "./SequenceBaseSig.sol";
import "./SequenceNoChainIdSig.sol";

import "../../interfaces/IModuleAuth.sol";

import "../../ModuleSelfAuth.sol";
import "../../ModuleStorage.sol";

import "../../../../utils/LibBytesPointer.sol";


abstract contract SequenceChainedSig is IModuleAuth, ModuleSelfAuth {
  using LibBytesPointer for bytes;

  bytes32 public constant SET_IMAGEHASH_TYPEHASH = keccak256("SetImagehash(bytes32 imageHash,uint256 checkpoint)");
  bytes32 internal constant LAST_AUTH_CHECKPOINT_KEY = keccak256("org.sequence.module.auth.submodule.prefixed.last.auth.checkpoint");

  event SetLastCheckpoint(uint256 _checkpoint);

  error LowWeightChainedSignature(bytes _signature, uint256 threshold, uint256 _weight);
  error WrongChainedCheckpointOrder(uint256 _current, uint256 _prev);
  error WrongFinalCheckpoint(uint256 _checkpoint, uint256 _current);

  function _hashSetImagehashStruct(bytes32 _imageHash, uint256 _checkpoint) internal pure returns (bytes32) {
    return keccak256(abi.encode(SET_IMAGEHASH_TYPEHASH, _imageHash, _checkpoint));
  }

  function setLastAuthCheckpoint(uint256 _checkpoint) external onlySelf {
    ModuleStorage.writeBytes32(LAST_AUTH_CHECKPOINT_KEY, bytes32(_checkpoint));
    emit SetLastCheckpoint(_checkpoint);
  }

  function getLastAuthCheckpoint() public view returns (uint256) {
    return uint256(ModuleStorage.readBytes32(LAST_AUTH_CHECKPOINT_KEY));
  }

  struct SetImagehashStruct {
    uint256 checkpoint;
    bytes signature;
  }

  function chainedRecover(
    bytes32 _digest,
    bytes calldata _signature
  ) internal view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subDigest
  ) {
    uint256 rindex = 1;
    uint256 sigSize;

    //
    // First signature out of the loop
    //

    // First uint24 is the size of the signature
    (sigSize, rindex) = _signature.readUint24(rindex);
    uint256 nrindex = sigSize + rindex;

    (
      threshold,
      weight,
      imageHash,
      subDigest
    ) = signatureRecovery(
      _digest,
      _signature[rindex:nrindex]
    );

    if (weight < threshold) {
      revert LowWeightChainedSignature(_signature[rindex:nrindex], threshold, weight);
    }

    rindex = nrindex;

    uint256 prevCheckpoint = type(uint256).max;

    //
    // Afterward signatures are handled by this loop
    // this is done this way because the last signature does not have a
    // checkpoint
    //
    while (rindex < _signature.length) {
      // Next uint64 is the checkpoint
      // (this won't exist on the last signature)
      uint256 checkpoint; (checkpoint, rindex) = _signature.readUint64(rindex);
      if (checkpoint >= prevCheckpoint) {
        revert WrongChainedCheckpointOrder(checkpoint, prevCheckpoint);
      }

      prevCheckpoint = checkpoint;

      // First uint24 is the size of the signature
      (sigSize, rindex) = _signature.readUint24(rindex);
      nrindex = sigSize + rindex;

      (
        threshold,
        weight,
        imageHash,
        // Don't change the subdigest
        // it should remain the first signature
      ) = signatureRecovery(
        _hashSetImagehashStruct(imageHash, checkpoint),
        _signature[rindex:nrindex]
      );

      // Validate signature
      if (weight < threshold) {
        revert LowWeightChainedSignature(_signature[rindex:nrindex], threshold, weight);
      }

      rindex = nrindex;
    }

    if (prevCheckpoint <= getLastAuthCheckpoint()) {
      revert WrongFinalCheckpoint(prevCheckpoint, getLastAuthCheckpoint());
    }
  }
}

pragma solidity 0.8.14;

import "./SequenceBaseSig.sol";
import "./SequenceNoChainIdSig.sol";

import "../../interfaces/IModuleAuth.sol";

import "../../ModuleSelfAuth.sol";
import "../../ModuleStorage.sol";

import "../../../../utils/LibBytes.sol";

import "hardhat/console.sol";


abstract contract SequenceChainedSig is IModuleAuth, ModuleSelfAuth {
  using LibBytes for bytes;

  bytes32 public constant SET_IMAGEHASH_TYPEHASH = keccak256("SetImagehash(bytes32 imageHash,uint256 checkpoint)");
  bytes32 internal constant LAST_AUTH_CHECKPOINT_KEY = keccak256("org.sequence.module.auth.submodule.prefixed.last.auth.checkpoint");

  event SetLastCheckpoint(uint256 _checkpoint);

  error LowWeightChainedSignature(bytes _signature, uint256 threshold, uint256 _weight);
  error WrongChainedCheckpointOrder(uint256 _current, uint256 _prev);

  function _hashSetImagehashStruct(bytes32 _imageHash, uint256 _checkpoint) internal view returns (bytes32) {
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

    // first byte is signature type
    uint256 rindex = 1;

    bytes32 nextDigest = _digest;

    bytes32 thisSubDigest;
    uint256 sigSize;

    //
    // First signature out of the loop
    //

    // First uint16 is the size of the signature
    (sigSize, rindex) = _signature.cReadUint16(rindex);
    uint256 nrindex = sigSize + rindex;

    (
      threshold,
      weight,
      imageHash,
      thisSubDigest
    ) = signatureRecovery(nextDigest, _signature[rindex:nrindex]);

    if (weight < threshold) {
      revert LowWeightChainedSignature(_signature[rindex:nrindex], threshold, weight);
    }

    rindex = nrindex;

    //
    // Afterward signatures are handled by this loop
    // this is done this way because the last signature does not have a
    // checkpoint
    //
    while (rindex < _signature.length) {
      uint256 checkpoint;

      // Next uint64 is the checkpoint
      // (this won't exist on the last signature)
      (checkpoint, rindex) = _signature.cReadUint64(rindex);

      if (subDigest == bytes32(0)) {
        subDigest = thisSubDigest;
      }

      nextDigest = _hashSetImagehashStruct(imageHash, checkpoint);

      // First uint16 is the size of the signature
      (sigSize, rindex) = _signature.cReadUint16(rindex);
      uint256 nrindex = sigSize + rindex;

      (
        threshold,
        weight,
        imageHash,
        thisSubDigest
      ) = signatureRecovery(nextDigest, _signature[rindex:nrindex]);

      if (weight < threshold) {
        revert LowWeightChainedSignature(_signature[rindex:nrindex], threshold, weight);
      }

      rindex = nrindex;
    }
  }
}

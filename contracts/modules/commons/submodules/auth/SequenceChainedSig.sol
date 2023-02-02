// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./SequenceBaseSig.sol";
import "./SequenceNoChainIdSig.sol";

import "../../interfaces/IModuleAuth.sol";

import "../../ModuleSelfAuth.sol";
import "../../ModuleStorage.sol";

import "../../../../utils/LibBytesPointer.sol";
import "../../../../utils/LibOptim.sol";


abstract contract SequenceChainedSig is IModuleAuth, ModuleSelfAuth {
  using LibBytesPointer for bytes;

  bytes32 public constant SET_IMAGE_HASH_TYPE_HASH = keccak256("SetImageHash(bytes32 imageHash)");

  error LowWeightChainedSignature(bytes _signature, uint256 threshold, uint256 _weight);
  error WrongChainedCheckpointOrder(uint256 _current, uint256 _prev);

  function _hashSetImageHashStruct(bytes32 _imageHash) internal pure returns (bytes32) {
    return LibOptim.fkeccak256(SET_IMAGE_HASH_TYPE_HASH, _imageHash);
  }

  function chainedRecover(
    bytes32 _digest,
    bytes calldata _signature
  ) internal view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subdigest,
    uint256 checkpoint
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
      subdigest,
      checkpoint
    ) = signatureRecovery(
      _digest,
      _signature[rindex:nrindex]
    );

    if (weight < threshold) {
      revert LowWeightChainedSignature(_signature[rindex:nrindex], threshold, weight);
    }

    rindex = nrindex;

    //
    // Following signatures are handled by this loop
    // this is done this way because the last signature does not have a
    // checkpoint to be validated.
    //
    while (rindex < _signature.length) {
      // First uint24 is the size of the signature
      (sigSize, rindex) = _signature.readUint24(rindex);
      nrindex = sigSize + rindex;

      uint256 nextCheckpoint;

      (
        threshold,
        weight,
        imageHash,,
        // Don't change the subdigest
        // it should remain the one of the first signature
        nextCheckpoint
      ) = signatureRecovery(
        _hashSetImageHashStruct(imageHash),
        _signature[rindex:nrindex]
      );

      // Validate signature
      if (weight < threshold) {
        revert LowWeightChainedSignature(_signature[rindex:nrindex], threshold, weight);
      }

      if (nextCheckpoint >= checkpoint) {
        revert WrongChainedCheckpointOrder(nextCheckpoint, checkpoint);
      }

      checkpoint = nextCheckpoint;
      rindex = nrindex;
    }
  }
}

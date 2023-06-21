// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./SequenceBaseSig.sol";

import "../../interfaces/IModuleAuth.sol";

import "../../ModuleSelfAuth.sol";
import "../../ModuleStorage.sol";

import "../../../../utils/LibBytesPointer.sol";
import "../../../../utils/LibOptim.sol";

/**
 * @title Sequence chained auth recovery submodule
 * @author Agustin Aguilar (aa@horizon.io)
 * @notice Defines Sequence signatures that work by delegating control to new configurations.
 * @dev The delegations can be chained together, the first signature is the one that is used to validate
 *      the message, the last signature must match the current on-chain configuration of the wallet.
 */
abstract contract SequenceChainedSig is IModuleAuth, ModuleSelfAuth {
  using LibBytesPointer for bytes;

  bytes32 public constant SET_IMAGE_HASH_TYPE_HASH = keccak256("SetImageHash(bytes32 imageHash)");

  error LowWeightChainedSignature(bytes _signature, uint256 threshold, uint256 _weight);
  error WrongChainedCheckpointOrder(uint256 _current, uint256 _prev);

  /**
   * @notice Defined the special token that must be signed to delegate control to a new configuration.
   * @param _imageHash The hash of the new configuration.
   * @return bytes32 The message hash to be signed.
   */
  function _hashSetImageHashStruct(bytes32 _imageHash) internal pure returns (bytes32) {
    return LibOptim.fkeccak256(SET_IMAGE_HASH_TYPE_HASH, _imageHash);
  }

  /**
   * @notice Returns the threshold, weight, root, and checkpoint of a (chained) signature.
   * 
   * @dev This method return the `threshold`, `weight` and `imageHash` of the last signature in the chain.
   *      Intermediate signatures are validated directly in this method. The `subdigest` is the one of the
   *      first signature in the chain (since that's the one that is used to validate the message).
   *
   * @param _digest The digest to recover the signature from.
   * @param _signature The signature to recover.
   * @return threshold The threshold of the (last) signature.
   * @return weight The weight of the (last) signature.
   * @return imageHash The image hash of the (last) signature.
   * @return subdigest The subdigest of the (first) signature in the chain.
   * @return checkpoint The checkpoint of the (last) signature.
   */
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

    // The following signatures are handled by this loop.
    // This is done this way because the first signature does not have a
    // checkpoint to be validated against.
    while (rindex < _signature.length) {
      // First uint24 is the size of the signature
      (sigSize, rindex) = _signature.readUint24(rindex);
      nrindex = sigSize + rindex;

      uint256 nextCheckpoint;

      (
        threshold,
        weight,
        imageHash,,
        // Do not change the subdigest;
        // it should remain that of the first signature.
        nextCheckpoint
      ) = signatureRecovery(
        _hashSetImageHashStruct(imageHash),
        _signature[rindex:nrindex]
      );

      // Validate signature
      if (weight < threshold) {
        revert LowWeightChainedSignature(_signature[rindex:nrindex], threshold, weight);
      }

      // Checkpoints must be provided in descending order
      // since the first signature is the one that is used to validate the message
      // and the last signature is the one that is used to validate the current configuration
      if (nextCheckpoint >= checkpoint) {
        revert WrongChainedCheckpointOrder(nextCheckpoint, checkpoint);
      }

      checkpoint = nextCheckpoint;
      rindex = nrindex;
    }
  }
}

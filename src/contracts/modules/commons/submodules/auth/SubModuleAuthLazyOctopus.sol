// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "../../../../utils/LibBytes.sol";
import "../../interfaces/IModuleCalls.sol";

import "./SubModuleAuth.sol";

import "./utils/LazyOctopusV2Decoder.sol";


abstract contract SubModuleAuthLazyOctopus is SubModuleAuth {
  using LibBytes for bytes;

  uint256 internal constant LAZY_OCTOPUS_TYPE = 0x03;

  struct PresignedTx {
    IModuleCalls.Transaction transaction;
    uint256 nonce;
    bytes signature;
  } 

  function _recoverLazyOctopusSignature(
    bytes calldata _signature,
    bytes32 _digest,
    uint256 _rIndex
  ) internal virtual view returns (
    bool isValid,
    bytes32 subDigest
  ) {
    // Decode the signature
    // it contains both the presigned transactions and the signature
    // for the latest configuration
    (PresignedTx[] memory _txs, bytes memory signature) = abi.decode(_signature[1:], (PresignedTx[], bytes));

    // Validate and decode every transaction
    uint256 prevGapNonce =  IModuleCalls(address(this)).readGapNonce(LazyOctopusV2Decoder.SESSION_SPACE);
    bytes32 prevImageHash = bytes32(0);

    for (uint256 i = 0; i < _txs.length; i++) {
      (
        bytes32 nextImageHash,
        uint256 nextGapNonce
      ) = LazyOctopusV2Decoder.decodeLazyOctopusV2Batch(
        _txs[i].transaction,
        _txs[i].nonce,
        address(this)
      );

      bytes memory txSignature = _txs[i].signature;

      if (prevImageHash == bytes32(0) && nextGapNonce < prevGapNonce) {
        // We may be in-between updates
        // so gap nonce may be below the previous one
        // if that's the case, we just ignore it
        if (nextGapNonce <= prevGapNonce) {
          continue;
        }
      }

      (
        bytes32 recoveredImageHash,
        uint256 weight,
        uint256 threshold
      ) = SubModuleAuth(address(this))._recoverSignature(
        keccak256(
          abi.encode(
            _txs[i].transaction,
            _txs[i].nonce
          )
        ),
        txSignature,
        0
      );

      // RecoveredImageHash should be the previous one
      // or if the previous one is not defined, it should be the current one
      // the current one can be defined counter-factually or in the contract storage
      if (recoveredImageHash != prevImageHash) {
        // One of the presigned transactions has a bad signature
        // in this case we discart the whole signature
        if (prevImageHash != bytes32(0)) {
          return (false, bytes32(0));
        }

        // The imageHash must be valid for the `current` state
        if (!_isValidImage(nextImageHash)) {
          return (false, bytes32(0));
        }
      }

      prevImageHash = nextImageHash;
      prevGapNonce = nextGapNonce;
    }

    // Recover the actual signature
    // and compare it either with the counter-factual one
    // or with the "real" one
    subDigest = _subDigest(_digest, block.chainid);

    (
      bytes32 imageHash,
      uint256 weight,
      uint256 threshold
    ) = _recoverSignature(subDigest, _signature, _rIndex);

    isValid = (
      weight >= threshold &&
      prevImageHash != bytes32(0) ? imageHash == prevImageHash : _isValidImage(imageHash)
    );
  }
}

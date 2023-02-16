// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./SequenceBaseSig.sol";


library SequenceDynamicSig {

  /**
   * @notice Recover a "dynamically encoded" Sequence signature.
   * @dev The Signature is stripped of the first byte, which is the encoding flag.
   *
   * @param _subdigest The digest of the signature.
   * @param _signature The Sequence signature.
   * @return threshold The threshold weight required to validate the signature.
   * @return weight The weight of the signature.
   * @return imageHash The hash of the recovered configuration.
   * @return checkpoint The checkpoint of the configuration.
   */
  function recover(
    bytes32 _subdigest,
    bytes calldata _signature
  ) internal view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    uint256 checkpoint
  ) {
    return SequenceBaseSig.recover(_subdigest, _signature[1:]);
  }
}

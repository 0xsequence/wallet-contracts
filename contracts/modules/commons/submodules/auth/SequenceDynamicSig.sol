// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "./SequenceBaseSig.sol";


library SequenceDynamicSig {
  function recover(
    bytes32 _subDigest,
    bytes calldata _signature
  ) internal view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash
  ) {
    return SequenceBaseSig.recover(_subDigest, _signature[1:]);
  }
}

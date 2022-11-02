// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;

import "./SequenceBaseSig.sol";


library SequenceDynamicSig {
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

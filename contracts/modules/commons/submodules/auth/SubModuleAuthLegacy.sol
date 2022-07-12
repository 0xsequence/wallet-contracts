// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "../../../../utils/LibBytes.sol";
import "./SubModuleAuth.sol";


abstract contract SubModuleAuthLegacy is SubModuleAuth {
  using LibBytes for bytes;

  uint256 internal constant LEGACY_TYPE = 0x00;

  function _recoverLegacySignature(
    bytes calldata _signature,
    bytes32 _digest,
    uint256
  ) internal virtual view returns (
    bool isValid,
    bytes32 subDigest
  ) {
    subDigest = _subDigest(_digest, block.chainid);

    (
      bytes32 imageHash,
      uint256 weight,
      uint256 threshold
    ) = _recoverSignature(subDigest, _signature, 0);

    isValid = weight >= threshold && _isValidImage(imageHash);
  }
}

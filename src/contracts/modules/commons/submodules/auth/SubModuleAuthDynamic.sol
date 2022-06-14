// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "../../../../utils/LibBytes.sol";
import "./SubModuleAuth.sol";


abstract contract SubModuleAuthDynamic is SubModuleAuth {
  using LibBytes for bytes;

  uint256 internal constant DYNAMIC_TYPE = 0x01;
  uint256 internal constant DYNAMIC_NO_CHAIN_ID_TYPE = 0x02;

  function _recoverDynamicSignature(
    bytes calldata _signature,
    bytes32 _digest,
    uint256 _rIndex
  ) internal virtual view returns (
    bool isValid,
    bytes32 subDigest
  ) {
    subDigest = _subDigest(_digest, block.chainid);

    (
      bytes32 imageHash,
      uint256 weight,
      uint256 threshold
    ) = _recoverSignature(subDigest, _signature, _rIndex);

    isValid = weight >= threshold && _isValidImage(imageHash);
  }

  function _recoverDynamicNoChainIdSignature(
    bytes calldata _signature,
    bytes32 _digest,
    uint256 _rIndex
  ) internal virtual view returns (
    bool isValid,
    bytes32 subDigest
  ) {
    subDigest = _subDigest(_digest, 0);

    (
      bytes32 imageHash,
      uint256 weight,
      uint256 threshold
    ) = _recoverSignature(subDigest, _signature, _rIndex);

    isValid = weight >= threshold && _isValidImage(imageHash);
  }
}

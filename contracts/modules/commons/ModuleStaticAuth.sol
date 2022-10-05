// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "./ModuleAuth.sol";
import "./ModuleUpdate.sol";
import "./ModuleSelfAuth.sol";
import "./ModuleStorage.sol";

import "../../Wallet.sol";


abstract contract ModuleStaticAuth is ModuleSelfAuth, ModuleAuth {
  //                       STATIC_DIGEST_HASH_KEY = keccak256("org.sequence.module.static.auth.digest");
  bytes32 private constant STATIC_DIGEST_HASH_KEY = bytes32(0x7f25a23abc421d10864063e9a8ae5fd3fbd5116e156f148428b6a3a02ffd9454);

  event SetStaticDigest(bytes32 indexed _digest, uint256 _expiration);

  function _writeExpirationForStaticDigest(bytes32 _digest, uint256 _expiration) internal {
    ModuleStorage.writeBytes32Map(STATIC_DIGEST_HASH_KEY, _digest, bytes32(_expiration));
  }

  function _readExpirationForStaticDigest(bytes32 _digest) internal view returns (uint256) {
    return uint256(ModuleStorage.readBytes32Map(STATIC_DIGEST_HASH_KEY, _digest));
  }

  function _generateStaticSubdigest(bytes32 _digest) internal pure returns (bytes32) {
    return keccak256(
      abi.encodePacked(
        STATIC_DIGEST_HASH_KEY,
        _digest
      )
    );
  }

  function staticDigest(bytes32 _digest) external view returns (uint256) {
    return _readExpirationForStaticDigest(_digest);
  }

  function setStaticDigest(bytes32 _digest, uint256 _expiration) external onlySelf {
    _writeExpirationForStaticDigest(_digest, _expiration);

    emit SetStaticDigest(_digest, _expiration);
  }

  function addStaticDigests(bytes32[] calldata _digests) external onlySelf {
    unchecked {
      uint256 digestsLength = _digests.length;
      for (uint256 i = 0; i < digestsLength; i++) {
        bytes32 digest = _digests[i];
        _writeExpirationForStaticDigest(digest, type(uint256).max);
        emit SetStaticDigest(digest, type(uint256).max);
      }
    }
  }

  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal override virtual view returns (
    bool isValid,
    bytes32 subDigest
  ) {
    (isValid, subDigest) = super._signatureValidation(_digest, _signature);
    if (isValid) {
      return (isValid, subDigest);
    }

    // solhint-disable-next-line not-rely-on-time
    isValid = _readExpirationForStaticDigest(_digest) > block.timestamp;
    if (isValid) {
      subDigest = _generateStaticSubdigest(_digest);
    }

    return (isValid, subDigest);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "./ModuleAuth.sol";
import "./ModuleUpdate.sol";
import "./ModuleSelfAuth.sol";
import "./ModuleStorage.sol";

import "../../utils/LibBytes.sol";
import "../../utils/LibOptim.sol";
import "../../Wallet.sol";


abstract contract ModuleStaticMerkleAuth is ModuleSelfAuth, ModuleAuth {
  using LibBytes for bytes;

  //                       STATIC_AUTH_MERKLE_ROOT_KEY = keccak256("org.sequence.module.static.merkle.auth.root");
  bytes32 private constant STATIC_AUTH_MERKLE_ROOT_KEY = bytes32(0xc38481534f1c38910229ea1c0ad8a99925db3944c7b77e050d53ca6904db2300);
  bytes1 private constant SUBTYPE_MERKLE_PROOF = hex"00";

  event SetStaticDigestMerkleRoot(bytes32 indexed _root);

  function _writeStaticMerkleAuthRoot(bytes32 _root) internal {
    ModuleStorage.writeBytes32(STATIC_AUTH_MERKLE_ROOT_KEY, _root);
  }

  function _readStaticMerkleAuthRoot() internal view returns (bytes32) {
    return ModuleStorage.readBytes32(STATIC_AUTH_MERKLE_ROOT_KEY);
  }

  function _generateStaticMerkleSubdigest(bytes32 _digest) internal pure returns (bytes32) {
    return keccak256(
      abi.encodePacked(
        STATIC_AUTH_MERKLE_ROOT_KEY,
        _digest
      )
    );
  }

  function staticMerkleRoot() external view returns (bytes32) {
    return _readStaticMerkleAuthRoot();
  }

  function setStaticMerkleRoot(bytes32 _root) external onlySelf {
    _writeStaticMerkleAuthRoot(_root);

    emit SetStaticDigestMerkleRoot(_root);
  }

  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal override virtual view returns (
    bool isValid,
    bytes32 subDigest
  ) {
    // Validate the signature in a conventional way
    // if it fails, then we can try to validate it as a merkle proof
    (isValid, subDigest) = super._signatureValidation(_digest, _signature);
    if (isValid) {
      return (isValid, subDigest);
    }

    unchecked {
      // Validate type, subtype and size of the signature
      // before trying to evaluate it as a merkle proof
      uint256 signatureLength = _signature.length;
      if (
        signatureLength < 2 ||
        _signature[0] != STUB_TYPE ||
        _signature[1] != SUBTYPE_MERKLE_PROOF ||
        (signatureLength - 2) % 32 != 0
      ) {
        return (false, subDigest);
      }

      bytes32 root = _digest;
      // first byte is the signature type
      // we ignore it, we use this payload as a merkle proof instead
      for (uint256 i = 2; i < signatureLength; i += 32) {
        bytes32 sibling = _signature.readBytes32(i);
        if (root < sibling) {
          root = LibOptim.fkeccak256(root, sibling);
        } else {
          root = LibOptim.fkeccak256(sibling, root);
        }
      }

      subDigest = _generateStaticMerkleSubdigest(root);
      isValid = _digest != bytes32(0) && root == _readStaticMerkleAuthRoot();

      return (isValid, subDigest);
    }
  }
}

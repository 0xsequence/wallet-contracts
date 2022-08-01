// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "../../utils/LibBytes.sol";
import "../../utils/SignatureValidator.sol";
import "../../interfaces/IERC1271Wallet.sol";

import "./interfaces/IModuleAuth.sol";

import "./ModuleERC165.sol";

import "./submodules/auth/SequenceBaseSig.sol";
import "./submodules/auth/SequenceDynamicSig.sol";
import "./submodules/auth/SequenceNoChainIdSig.sol";
import "./submodules/auth/SequenceChainedSig.sol";


abstract contract ModuleAuth is
  IModuleAuth,
  ModuleERC165,
  IERC1271Wallet,
  SequenceChainedSig
{
  using LibBytes for bytes;

  bytes1 private constant LEGACY_TYPE = hex"00";
  bytes1 private constant DYNAMIC_TYPE = hex"01";
  bytes1 private constant NO_CHAIN_ID_TYPE = hex"02";
  bytes1 private constant CHAINED_TYPE = hex"03";

  bytes4 private constant SELECTOR_ERC1271_BYTES_BYTES = 0x20c13b0b;
  bytes4 private constant SELECTOR_ERC1271_BYTES32_BYTES = 0x1626ba7e;

  function signatureRecovery(
    bytes32 _digest,
    bytes calldata _signature
  ) public override virtual view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subDigest
  ) {
    bytes1 signatureType = _signature[0];

    if (signatureType == LEGACY_TYPE) {
      // networkId digest + base recover
      subDigest = SequenceBaseSig.subDigest(_digest);
      (threshold, weight, imageHash) = SequenceBaseSig.recover(subDigest, _signature);
      return (threshold, weight, imageHash, subDigest);
    }

    if (signatureType == DYNAMIC_TYPE) {
      // noChainId digest + dynamic recovery
      subDigest = SequenceBaseSig.subDigest(_digest);
      (threshold, weight, imageHash) = SequenceDynamicSig.recover(subDigest, _signature);
      return (threshold, weight, imageHash, subDigest);
    }

    if (signatureType == NO_CHAIN_ID_TYPE) {
      // networkId digest + dynamic recover
      subDigest = SequenceNoChainIdSig.subDigest(_digest);
      (threshold, weight, imageHash) = SequenceDynamicSig.recover(subDigest, _signature);
      return (threshold, weight, imageHash, subDigest);
    }

    if (signatureType == CHAINED_TYPE) {
      // original digest + chained recover
      // (subdigest will be computed in the chained recovery)
      return chainedRecover(_digest, _signature);
    }

    revert InvalidSignatureType(signatureType);
  }

  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal override virtual view returns (
    bool isValid,
    bytes32 subDigest
  ) {
    uint256 threshold; uint256 weight; bytes32 imageHash;
    (threshold, weight, imageHash, subDigest) = signatureRecovery(_digest, _signature);
    isValid = weight >= threshold && _isValidImage(imageHash);
  }

  /**
   * @notice Will hash _data to be signed (similar to EIP-712)
   * @param _digest Pre-final digest
   * @return hashed data for this wallet
   */
  function _subDigest(bytes32 _digest, uint256 _chainId) internal override virtual view returns (bytes32) {
    return keccak256(
      abi.encodePacked(
        "\x19\x01",
        _chainId,
        address(this),
        _digest
      )
    );
  }

  /**
   * @notice Verifies whether the provided signature is valid with respect to the provided data
   * @dev MUST return the correct magic value if the signature provided is valid for the provided data
   *   > The bytes4 magic value to return when signature is valid is 0x20c13b0b : bytes4(keccak256("isValidSignature(bytes,bytes)"))
   * @param _data       Arbitrary length data signed on the behalf of address(this)
   * @param _signatures Signature byte array associated with _data.
   *                    Encoded as abi.encode(Signature[], Configs)
   * @return magicValue Magic value 0x20c13b0b if the signature is valid and 0x0 otherwise
   */
  function isValidSignature(
    bytes calldata _data,
    bytes calldata _signatures
  ) external override virtual view returns (bytes4) {
    // Validate signatures
    (bool isValid,) = _signatureValidation(keccak256(_data), _signatures);
    if (isValid) {
      return SELECTOR_ERC1271_BYTES_BYTES;
    }

    return bytes4(0);
  }

  /**
   * @notice Verifies whether the provided signature is valid with respect to the provided hash
   * @dev MUST return the correct magic value if the signature provided is valid for the provided hash
   *   > The bytes4 magic value to return when signature is valid is 0x1626ba7e : bytes4(keccak256("isValidSignature(bytes32,bytes)"))
   * @param _hash       keccak256 hash that was signed
   * @param _signatures Signature byte array associated with _data.
   *                    Encoded as abi.encode(Signature[], Configs)
   * @return magicValue Magic value 0x1626ba7e if the signature is valid and 0x0 otherwise
   */
  function isValidSignature(
    bytes32 _hash,
    bytes calldata _signatures
  ) external override virtual view returns (bytes4) {
    // Validate signatures
    (bool isValid,) = _signatureValidation(_hash, _signatures);
    if (isValid) {
      return SELECTOR_ERC1271_BYTES32_BYTES;
    }

    return bytes4(0);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(bytes4 _interfaceID) public override virtual pure returns (bool) {
    if (
      _interfaceID == type(IModuleAuth).interfaceId ||
      _interfaceID == type(IERC1271Wallet).interfaceId
    ) {
      return true;
    }

    return super.supportsInterface(_interfaceID);
  }
}

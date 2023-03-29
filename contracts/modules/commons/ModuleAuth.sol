// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "../../utils/LibBytes.sol";
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

  bytes1 internal constant LEGACY_TYPE = hex"00";
  bytes1 internal constant DYNAMIC_TYPE = hex"01";
  bytes1 internal constant NO_CHAIN_ID_TYPE = hex"02";
  bytes1 internal constant CHAINED_TYPE = hex"03";

  bytes4 internal constant SELECTOR_ERC1271_BYTES_BYTES = 0x20c13b0b;
  bytes4 internal constant SELECTOR_ERC1271_BYTES32_BYTES = 0x1626ba7e;

  /**
   * @notice Recovers the threshold, weight, imageHash, subdigest, and checkpoint of a signature.
   * @dev The signature must be prefixed with a type byte, which is used to determine the recovery method.
   *
   * @param _digest Digest of the signed data.
   * @param _signature A Sequence signature.
   *
   * @return threshold The required number of signatures needed to consider the signature valid.
   * @return weight The actual number of signatures collected in the signature.
   * @return imageHash The imageHash of the configuration that signed the message.
   * @return subdigest A modified version of the original digest, unique for each wallet/network.
   * @return checkpoint A nonce that is incremented every time a new configuration is set.
   */
  function signatureRecovery(
    bytes32 _digest,
    bytes calldata _signature
  ) public override virtual view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subdigest,
    uint256 checkpoint
  ) {
    bytes1 signatureType = _signature[0];

    if (signatureType == LEGACY_TYPE) {
      // networkId digest + base recover
      subdigest = SequenceBaseSig.subdigest(_digest);
      (threshold, weight, imageHash, checkpoint) = SequenceBaseSig.recover(subdigest, _signature);
      return (threshold, weight, imageHash, subdigest, checkpoint);
    }

    if (signatureType == DYNAMIC_TYPE) {
      // networkId digest + dynamic recover
      subdigest = SequenceBaseSig.subdigest(_digest);
      (threshold, weight, imageHash, checkpoint) = SequenceDynamicSig.recover(subdigest, _signature);
      return (threshold, weight, imageHash, subdigest, checkpoint);
    }

    if (signatureType == NO_CHAIN_ID_TYPE) {
      // noChainId digest + dynamic recover
      subdigest = SequenceNoChainIdSig.subdigest(_digest);
      (threshold, weight, imageHash, checkpoint) = SequenceDynamicSig.recover(subdigest, _signature);
      return (threshold, weight, imageHash, subdigest, checkpoint);
    }

    if (signatureType == CHAINED_TYPE) {
      // original digest + chained recover
      // (subdigest will be computed in the chained recover)
      return chainedRecover(_digest, _signature);
    }

    revert InvalidSignatureType(signatureType);
  }

  /**
   * @dev Validates a signature.
   *
   * @param _digest Digest of the signed data.
   * @param _signature A Sequence signature.
   *
   * @return isValid Indicates whether the signature is valid or not.
   * @return subdigest A modified version of the original digest, unique for each wallet/network.
   */
  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal override virtual view returns (
    bool isValid,
    bytes32 subdigest
  ) {
    uint256 threshold; uint256 weight; bytes32 imageHash;
    (threshold, weight, imageHash, subdigest,) = signatureRecovery(_digest, _signature);
    isValid = weight >= threshold && _isValidImage(imageHash);
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
  ) public override virtual view returns (bytes4) {
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
  ) public override virtual view returns (bytes4) {
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

  /**
   * @notice Updates the signers configuration of the wallet
   * @param _imageHash New required image hash of the signature
   */
  function updateImageHash(bytes32 _imageHash) external override virtual onlySelf {
    _updateImageHash(_imageHash);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "../../utils/LibBytes.sol";
import "../../utils/SignatureValidator.sol";
import "../../interfaces/IERC1271Wallet.sol";

import "./interfaces/IModuleAuth.sol";

import "./ModuleERC165.sol";

import "./submodules/auth/SubModuleAuth.sol";
import "./submodules/auth/SubModuleAuthLegacy.sol";
import "./submodules/auth/SubModuleAuthDynamic.sol";
import "./submodules/auth/SubModuleAuthLazyOctopus.sol";

/**
  Signature encoding:

  First byte defines the type:

  - 0x00 for v1 -(Legacy)
  - 0x01 for v2 - Dynamic legacy (legacy with thershold above 255, it's legacy shifted by 8 bits)
  - 0x02 for v3 - Dynamic v2 without chainId on subDigest (uses zero)

  Type 0x00 and 0x01:
  
    The signature must be solidity packed and contain the total number of owners,
    the threshold, the weight and either the address or a signature for each owner.
    Each weight & (address or signature) pair is prefixed by a flag that signals if such pair
    contains an address or a signature. The aggregated weight of the signatures must surpass the threshold.

    Flag types:
      0x00 - Signature
      0x01 - Address

    E.g:
      abi.encodePacked(
        uint16 threshold,
        uint8 01,  uint8 weight_1, address signer_1,
        uint8 00, uint8 weight_2, bytes signature_2,
        ...
        uint8 01,  uint8 weight_5, address signer_5
      )
*/
abstract contract ModuleAuth is
  IModuleAuth,
  ModuleERC165,
  SignatureValidator,
  IERC1271Wallet,
  SubModuleAuth,
  SubModuleAuthLegacy,
  SubModuleAuthDynamic,
  SubModuleAuthLazyOctopus
{
  using LibBytes for bytes;

  uint256 private constant FLAG_SIGNATURE = 0;
  uint256 private constant FLAG_ADDRESS = 1;
  uint256 private constant FLAG_DYNAMIC_SIGNATURE = 2;

  bytes4 private constant SELECTOR_ERC1271_BYTES_BYTES = 0x20c13b0b;
  bytes4 private constant SELECTOR_ERC1271_BYTES32_BYTES = 0x1626ba7e;

  /**
   * @notice Verify if signer is default wallet owner
   * @param _digest     Digest of the signed message
   * @param _signature  Array of signatures with signers ordered
   *                    like the the keys in the multisig configs
   */
  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal override virtual view returns (bool isValid, bytes32 subDigest) {
    unchecked {
      // Get signature type
      (uint8 signatureType, uint256 rindex) = _signature.cReadFirstUint8();

      // Signature validation dispatcher

      // Signature type 0x00 - Legacy
      // SubModuleAuthLegacy.sol
      if (signatureType == LEGACY_TYPE) {
        return _recoverLegacySignature(_signature, _digest, rindex);
      }

      // Signature type 0x01 - Dynamic
      // SubModuleAuthDynamic.sol
      if (signatureType == DYNAMIC_TYPE) {
        return _recoverDynamicSignature(_signature, _digest, rindex);
      }

      // Signature type 0x02 - Dynamic v2 without chainId on subDigest
      // SubModuleAuthDynamic.sol
      if (signatureType == DYNAMIC_NO_CHAIN_ID_TYPE) {
        return _recoverDynamicNoChainIdSignature(_signature, _digest, rindex);
      }

      // Signature type 0x03 - Prefixed with LazyOctopus transactions
      // SubModuleAuthLazyOctopus.sol
      if (signatureType == LAZY_OCTOPUS_TYPE) {
        return _recoverLazyOctopusSignature(_signature, _digest, rindex);
      }

      revert InvalidSignatureType(signatureType);
    }
  }

  /**
   * @notice Will hash _data to be signed (similar to EIP-712)
   * @param _digest Pre-final digest
   * @return hashed data for this wallet
   */
  function _subDigest(bytes32 _digest, uint256 _chanId) internal override virtual view returns (bytes32) {
    return keccak256(
      abi.encodePacked(
        "\x19\x01",
        _chanId,
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

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "../../utils/LibBytes.sol";
import "../../utils/SignatureValidator.sol";
import "../../interfaces/IERC1271Wallet.sol";

import "./interfaces/IModuleAuth.sol";

import "./ModuleERC165.sol";

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
abstract contract ModuleAuth is IModuleAuth, ModuleERC165, SignatureValidator, IERC1271Wallet {
  using LibBytes for bytes;

  uint256 private constant FLAG_SIGNATURE = 0;
  uint256 private constant FLAG_ADDRESS = 1;
  uint256 private constant FLAG_DYNAMIC_SIGNATURE = 2;

  bytes4 private constant SELECTOR_ERC1271_BYTES_BYTES = 0x20c13b0b;
  bytes4 private constant SELECTOR_ERC1271_BYTES32_BYTES = 0x1626ba7e;

  uint256 private constant LEGACY_TYPE = 0x00;
  uint256 private constant DYNAMIC_LEGACY_TYPE = 0x01;
  uint256 private constant DYNAMIC_NO_CHAIN_ID_TYPE = 0x02;

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

      // Get chainId for computing the subdigest
      // (do it now because a type may override it)
      {
        uint256 chainId = block.chainid;

        if (signatureType == LEGACY_TYPE) {
          // Legacy signatures didn't have a type, so we need
          // to reset the pointer back to zero, so it uses 0x00 as part
          // of the threshold.
          rindex = 0;
        } else if (signatureType == DYNAMIC_LEGACY_TYPE) {
          // DO NOTHING, for now
        } else if (signatureType == DYNAMIC_NO_CHAIN_ID_TYPE) {
          // Replace chainId with 0
          // for universal signatures
          chainId = 0;
        } else {
          revert InvalidSignatureType(signatureType);
        }

        // Compute subdigest
        subDigest = _subDigest(_digest, chainId);
      }

      // Decode signature
      (bytes32 imageHash, uint256 weight, uint256 threshold) = _recoverSignature(subDigest, _signature, rindex);

      isValid = weight >= threshold && _isValidImage(imageHash);
    }
  }

  function _recoverSignature(
    bytes32 _msgSubDigest,
    bytes calldata _signature,
    uint256 _rindex
  ) internal virtual view returns (
    bytes32 _imageHash,
    uint256 _weight,
    uint256 _thershold
  ) {
    unchecked {
      uint256 rindex = _rindex;
      (_thershold, rindex) = _signature.cReadUint16(rindex);

      // Start image hash generation
      _imageHash = bytes32(uint256(_thershold));

      // Iterate until the image is completed
      while (rindex < _signature.length) {
        // Read next item type and addrWeight
        uint256 flag; uint256 addrWeight; address addr;
        (flag, addrWeight, rindex) = _signature.cReadUint8Uint8(rindex);

        if (flag == FLAG_ADDRESS) {
          // Read plain address
          (addr, rindex) = _signature.cReadAddress(rindex);

        } else if (flag == FLAG_SIGNATURE) {
          // Read single signature and recover signer
          uint256 nrindex = rindex + 66;
          addr = recoverSigner(_msgSubDigest, _signature[rindex:nrindex]);
          rindex = nrindex;

          // Acumulate total weight of the signature
          _weight += addrWeight;
        } else if (flag == FLAG_DYNAMIC_SIGNATURE) {
          // Read signer
          (addr, rindex) = _signature.cReadAddress(rindex);
          // Read signature size
          uint256 size;
          (size, rindex) = _signature.cReadUint16(rindex);

          // Read dynamic size signature
          uint256 nrindex = rindex + size;
          if (!isValidSignature(_msgSubDigest, addr, _signature[rindex:nrindex])) {
            revert InvalidNestedSignature(_msgSubDigest, addr, _signature[rindex:nrindex]);
          }
          rindex = nrindex;

          // Acumulate total weight of the signature
          _weight += addrWeight;
        } else {
          revert InvalidSignatureFlag(flag);
        }

        // Write weight and address to image
        _imageHash = keccak256(abi.encode(_imageHash, addrWeight, addr));
      }
    }
  }

  /**
   * @notice Validates the signature image
   * @param _imageHash Hashed image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes32 _imageHash) internal virtual view returns (bool);

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

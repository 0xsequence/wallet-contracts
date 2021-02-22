// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;

import "../../utils/LibBytes.sol";
import "../../utils/SignatureValidator.sol";
import "../../interfaces/IERC1271Wallet.sol";

import "./interfaces/IModuleAuth.sol";

import "./ModuleERC165.sol";


abstract contract ModuleAuth is IModuleAuth, ModuleERC165, SignatureValidator, IERC1271Wallet {
  using LibBytes for bytes;

  uint256 private constant FLAG_SIGNATURE = 0;
  uint256 private constant FLAG_ADDRESS = 1;
  uint256 private constant FLAG_DYNAMIC_SIGNATURE = 2;

  bytes4 private constant SELECTOR_ERC1271_BYTES_BYTES = 0x20c13b0b;
  bytes4 private constant SELECTOR_ERC1271_BYTES32_BYTES = 0x1626ba7e;

  /**
   * @notice Verify if signer is default wallet owner
   * @param _hash       Hashed signed message
   * @param _signature  Array of signatures with signers ordered
   *                    like the the keys in the multisig configs
   *
   * @dev The signature must be solidity packed and contain the total number of owners,
   *      the threshold, the weight and either the address or a signature for each owner.
   *
   *      Each weight & (address or signature) pair is prefixed by a flag that signals if such pair
   *      contains an address or a signature. The aggregated weight of the signatures must surpass the threshold.
   *
   *      Flag types:
   *        0x00 - Signature
   *        0x01 - Address
   *
   *      E.g:
   *      abi.encodePacked(
   *        uint16 threshold,
   *        uint8 01,  uint8 weight_1, address signer_1,
   *        uint8 00, uint8 weight_2, bytes signature_2,
   *        ...
   *        uint8 01,  uint8 weight_5, address signer_5
   *      )
   */
  function _signatureValidation(
    bytes32 _hash,
    bytes memory _signature
  )
    internal override view returns (bool)
  {
    (
      uint16 threshold,  // required threshold signature
      uint256 rindex     // read index
    ) = _signature.readFirstUint16();

    // Start image hash generation
    bytes32 imageHash = bytes32(uint256(threshold));

    // Acumulated weight of signatures
    uint256 totalWeight;

    // Iterate until the image is completed
    while (rindex < _signature.length) {
      // Read next item type and addrWeight
      uint256 flag; uint256 addrWeight; address addr;
      (flag, addrWeight, rindex) = _signature.readUint8Uint8(rindex);

      if (flag == FLAG_ADDRESS) {
        // Read plain address
        (addr, rindex) = _signature.readAddress(rindex);
      } else if (flag == FLAG_SIGNATURE) {
        // Read single signature and recover signer
        bytes memory signature;
        (signature, rindex) = _signature.readBytes66(rindex);
        addr = recoverSigner(_hash, signature);

        // Acumulate total weight of the signature
        totalWeight += addrWeight;
      } else if (flag == FLAG_DYNAMIC_SIGNATURE) {
        // Read signer
        (addr, rindex) = _signature.readAddress(rindex);

        // Read signature size
        uint256 size;
        (size, rindex) = _signature.readUint16(rindex);

        // Read dynamic size signature
        bytes memory signature;
        (signature, rindex) = _signature.readBytes(rindex, size);
        require(isValidSignature(_hash, addr, signature), "ModuleAuth#_signatureValidation: INVALID_SIGNATURE");

        // Acumulate total weight of the signature
        totalWeight += addrWeight;
      } else {
        revert("ModuleAuth#_signatureValidation INVALID_FLAG");
      }

      // Write weight and address to image
      imageHash = keccak256(abi.encode(imageHash, addrWeight, addr));
    }

    return totalWeight >= threshold && _isValidImage(imageHash);
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
  function _subDigest(bytes32 _digest) internal override view returns (bytes32) {
    uint256 chainId; assembly { chainId := chainid() }
    return keccak256(
      abi.encodePacked(
        "\x19\x01",
        chainId,
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
  ) external override view returns (bytes4) {
    // Validate signatures
    if (_signatureValidation(_subDigest(keccak256(_data)), _signatures)) {
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
  ) external override view returns (bytes4) {
    // Validate signatures
    if (_signatureValidation(_subDigest(_hash), _signatures)) {
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

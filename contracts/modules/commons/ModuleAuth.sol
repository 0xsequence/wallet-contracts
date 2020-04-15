pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "../../utils/LibBytes.sol";
import "../../utils/SignatureValidator.sol";
import "../../interfaces/IERC1271Wallet.sol";

import "./interfaces/IModuleAuth.sol";


abstract contract ModuleAuth is IModuleAuth, SignatureValidator, IERC1271Wallet {
  using LibBytes for bytes;

  /**
   * @notice Verify if signer is default wallet owner
   * @param _hash       Hashed signed message
   * @param _signature  Array of signatures with signers ordered
   *                    like the the keys in the multisig configs
   *
   * @dev The signature must be solidity packed and contain the total number of owners,
   *      the threshold, the weigth and either the address or a signature for each owner.
   *
   *      Each weight & (address or signature) pair is prefixed by a boolean that signals if such pair
   *      contains an address or a signature. The aggregated weight of the signatures must surpass the threshold.
   *
   *      E.g:
   *      abi.encodePacked(
   *        uint8 nSigners, uint16 threshold,
   *        bool true,  uint8 weight_1, address signer_1,
   *        bool false, uint8 weight_2, bytes signature_2,
   *        ...
   *        bool true,  uint8 weight_5, address signer_5
   *      )
   */
  function _signatureValidation(
    bytes32 _hash,
    bytes memory _signature
  )
    internal override view returns (bool)
  {
    (
      uint8 total,       // total number of accounts in multisig
      uint16 threshold,  // required threshold signature
      uint256 rindex     // read index
    ) = _signature.readUint8Uint16(0);

    // The first byte defines how many address the wallet has
    // each address takes 21 bytes on the image (1 weight + 20 address)
    // imageSize requires 2 aditional bytes for the threshold
    uint256 imageSize = 2 + total * 21;
    bytes memory image = new bytes(imageSize);

    // Write threshold to image
    uint256 windex = image.writeUint16(0, threshold);

    // Acumulated weight of signatures
    uint256 totalWeight;

    // Iterate until the image is completed
    while (windex < imageSize) {
      // Read next item type and addrWeight
      bool isAddr; uint8 addrWeight; address addr;
      (isAddr, addrWeight, rindex) = _signature.readBoolUint8(rindex);

      if (isAddr) {
        // Read plain address
        (addr, rindex) = _signature.readAddress(rindex);
      } else {
        // Read single signature and recover signer
        bytes memory signature;
        (signature, rindex) = _signature.readBytes66(rindex);
        addr = recoverSigner(_hash, signature);

        // Acumulate total weight of the signature
        totalWeight += addrWeight;
      }

      // Write weight and address to image
      windex = image.writeUint8Address(windex, addrWeight, addr);
    }

    return totalWeight >= threshold && _isValidImage(image);
  }

  /**
   * @notice Validates the signature image
   * @param _image Image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes memory _image) internal virtual view returns (bool);

  /**
   * @notice Will hash _data to be signed (similar to EIP-712)
   * @param _data Data to be hashed
   * @return hashed data for this wallet
   */
  function _hashData(bytes memory _data) internal override view returns (bytes32) {
    return keccak256(
      abi.encodePacked(
        "\x19\x01",
        address(this),
        keccak256(_data)
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
    if (_signatureValidation(_hashData(_data), _signatures)) {
      return 0x20c13b0b;
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
    if (_signatureValidation(_hash, _signatures)) {
      return 0x1626ba7e;
    }
  }
}

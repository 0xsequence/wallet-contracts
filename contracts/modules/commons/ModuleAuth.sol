pragma solidity ^0.6.4;
pragma experimental ABIEncoderV2;

import "./ModuleBase.sol";
import "../../utils/LibBytes.sol";
import "../../utils/SignatureValidator.sol";
import "../../interfaces/IERC1271Wallet.sol";

import "@nomiclabs/buidler/console.sol";

contract ModuleAuth is ModuleBase, SignatureValidator, IERC1271Wallet {
  using LibBytes for bytes;

  // keccak256("placeholder-init-code-hash")
  bytes32 public constant INIT_CODE_HASH = 0xa4e481c95834a9f994a80cd4ecc88bdd3e78ff54100ecf2903aa9ef3eed54a91;

  // keccak256("placeholder-factory")[12:]
  address public constant FACTORY = address(0x52AA901CAD8AFf3Cf157715c19632F79D9B2d049);

  // Hash of the multisig information
  bytes32 internal configsHash;

  // Encoding structure for the multisigHash
  struct Configs {
    uint8 threshold; // Cumulative weigth that needs to be exceeded
    address[] keys;  // Array containing current multisig keys
    uint8[] weigths; // Weigth each key has for multisig
  }

  // Event recording the new parameters for multisig
  event ConfigsUpdated(Configs newConfigs, bytes32 newConfigHash);

  /**
   * @notice Update the multisig configurations
   * @param _newConfigs New multisig configurations
   */
  function updateConfigs(Configs calldata _newConfigs) external onlySelf {
    bytes32 new_config_hash = keccak256(abi.encode(_newConfigs));
    configsHash = new_config_hash;
    emit ConfigsUpdated(_newConfigs, new_config_hash);
  }

  /**
   * @notice Verify if signer is default wallet owner
   * @param _hash       Hashed signed message
   * @param _signature  Array of signatures with signers ordered
   *                    like the the keys in the multisig configs
   */
  function _signatureValidation(
    bytes32 _hash,
    bytes memory _signature
  )
    internal view returns (bool)
  {
    // The first byte defines how many address has the wallet
    // each address requires 21 bytes on the image (1 weight + 20 address)
    // imageSize aditionally requires 2 bytes for the threshold
    uint256 imageSize = 2 + uint256(uint8(_signature[0])) * 21;
    bytes memory image = new bytes(imageSize);

    // The next 2 bytes are used to store the wallet threshold
    uint256 threshold = uint256(_signature.readBytes32(1) >> 240);

    // Write the first 2 bytes of the image, that stores the threshold
    LibBytes.writeBytes32(image, 0, bytes32(threshold << 240));

    uint256 totalWeight; // Weigth of signatures

    uint256 windex = 2; // write index (starts on threshold)
    uint256 rindex = 3; // read index (starts on threshold + size)

    // Iterate until the image is completed
    while (windex < imageSize) {
      uint256 isAddr;
      uint256 addrWeigth;
      address addr;

      { // Create a new scope, avoid `Stack too deep` error
        // Read a full word to reduce the number of operations
        bytes32 word = _signature.readBytes32(rindex);

        // First byte defines if the word contains a signature or an address
        isAddr = uint256(word >> 248);

        // The next byte contains the weigth for the address
        addrWeigth = uint256(
          bytes32(word >> 240) &         // Second byte of word
          bytes32(uint256((1 << 8) - 1)) // 1 byte mask
        );

        if (isAddr == 0) {
          // Read raw address from the signature
          addr = address(uint256(
            bytes32(word >> 80) &            // 20 bytes after isAddr and weigth
            bytes32(uint256((1 << 160) - 1)) // address mask
          ));

          // Advance the read index
          // 1 isAddr + 1 addrWeigth + 20 addr
          rindex += 22;
        }
      }

      if (isAddr != 0) {
        // Read single signature and recover signer
        addr = recoverSigner(
          _hash,                               // Hashed message
          _signature.readBytes32(rindex + 2),  // r
          _signature.readBytes32(rindex + 34), // s
          uint8(_signature[rindex + 66]),      // v
          uint8(_signature[rindex + 67])       // Signature type
        );

        // Advance the read index
        // 1 isAddr + 1 addrWeigth + 66 signature
        rindex += 68;

        // Acumulate total weigth of the signature
        totalWeight += addrWeigth;
      }

      // Write address to image
      // 1 byte weigth + 20 bytes addr
      image.writeBytes32(windex, bytes32(addrWeigth << 248 | uint256(addr) << 88));
      windex += 21;
    }

    return totalWeight >= threshold && getConfigAddress(image) == address(this);
  }

  /**
   * @notice Will hash _data to be signed (similar to EIP-712)
   * @param _data Data to be hashed
   * @return hashed data for this wallet
   */
  function _hashData(bytes memory _data) internal view returns (bytes32) {
    return keccak256(
      abi.encodePacked(
        "\x19\x01",
        address(this),
        keccak256(_data)
      )
    );
  }

  /**
   * @notice Will return the wallet address created by the factory for provided configuration struct
   * @param _configs Multisignature configuration struct
   */
  function getConfigAddress(bytes memory _configs) public pure returns(address) {
    return address(
      uint256(
        keccak256(
          abi.encodePacked(
            byte(0xff),
            FACTORY,
            keccak256(_configs),
            INIT_CODE_HASH
          )
        )
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

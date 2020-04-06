pragma solidity ^0.6.4;
pragma experimental ABIEncoderV2;

import "./ModuleBase.sol";
import "../../utils/SignatureValidator.sol";
import "../../interfaces/IERC1271Wallet.sol";


contract ModuleAuth is ModuleBase, SignatureValidator, IERC1271Wallet {
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
   * @param _signatures Array of signatures with signers ordered 
   *                    like the the keys in the multisig configs
   * @param _configs    Multisig configuration for current wallet
   */
  function _signatureValidation(
    bytes32 _hash,
    Signature[] memory _signatures,
    Configs memory _configs
  )
    internal view
  {
    // Initializing variables
    uint256 key_idx; // Index of key in config
    address signer;  // Recovered signer
    uint256 weigth;  // Cumulative siners weights

    // Check if configs provided are correct
    require(
      getConfigAddress(_configs) == address(this),
      "ModuleAuth#_signatureValidation: INVALID_MULTISIG_CONFIGS"
    );

    // Check if signer threshold is met by going over signers
    // Assumes signatures are sorted like in Configs
    for (uint256 i = 0; i < _signatures.length; i++) {
      signer = recoverSigner(_hash, _signatures[i]);

      // Loop until you find expected signer
      while (_configs.keys[key_idx] != signer) {
        key_idx++;
      }

      // Add signer's weigth
      weigth += _configs.weigths[key_idx];

      // Move to next signer in config (no duplicates)
      key_idx++;
    }

    // Verify that signers weight exceeds threshold
    require(
      weigth >= _configs.threshold,
      "ModuleAuth#_signatureValidation: INSUFFICINET_SIGNATURE_WEIGTH"
    );
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
  function getConfigAddress(Configs memory _configs) public pure returns(address) {
    return address(
      uint256(
        keccak256(
          abi.encodePacked(
            byte(0xff),
            FACTORY, 
            keccak256(abi.encode(_configs)),
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
    // Decode signatures and multisig configs
    (Signature[] memory signatures, Configs memory configs) = abi.decode(_signatures, (Signature[], Configs));

    // Validate signatures
    _signatureValidation(_hashData(_data), signatures, configs);
    return 0x20c13b0b;
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
    // Decode signatures and multisig configs
    (Signature[] memory signatures, Configs memory configs) = abi.decode(_signatures, (Signature[], Configs));

    // Validate signatures
    _signatureValidation(_hash, signatures, configs);
    return 0x1626ba7e;
  }
}

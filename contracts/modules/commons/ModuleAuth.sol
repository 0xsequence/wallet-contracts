pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "../../utils/SignatureValidator.sol";
import "../../interfaces/IERC1271Wallet.sol";

import "./interfaces/IModuleAuth.sol";


contract ModuleAuth is IModuleAuth, SignatureValidator, IERC1271Wallet {
  bytes32 public immutable INIT_CODE_HASH;
  address public immutable FACTORY;

  constructor(bytes32 _initCodeHash, address _factory) public {
    INIT_CODE_HASH = _initCodeHash;
    FACTORY = _factory;
  }

  /**
   * @notice Hashed _data to be signed
   * @param _data Data to be hashed
   * @return hashed data for this wallet
   *   keccak256(abi.encode(wallet, _data))
   */
  function _hashData(bytes memory _data) internal override view returns (bytes32) {
    return keccak256(abi.encode(address(this), _data));
  }

  /**
   * @notice Verify if signer is default wallet owner
   * @param _hash Hashed signed message
   * @param _signature Encoded signature
   *       (bytes32 r, bytes32 s, uint8 v, SignatureType sigType)
   * @return True is the signature is valid
   */
  function _signatureValidation(bytes32 _hash, bytes memory _signature)
    internal override view returns (bool)
  {
    // Retrieve the signer
    address signer = recoverSigner(_hash, _signature);

    // Verifier if wallet was created for signer
    address candidate = address(uint256(keccak256(abi.encodePacked(byte(0xff), FACTORY, bytes32(uint256(signer)), INIT_CODE_HASH))));
    return candidate == address(this);
  }

  /**
   * @notice Verifies whether the provided signature is valid with respect to the provided data
   * @dev MUST return the correct magic value if the signature provided is valid for the provided data
   *   > The bytes4 magic value to return when signature is valid is 0x20c13b0b : bytes4(keccak256("isValidSignature(bytes,bytes)"))
   * @param _data       Arbitrary length data signed on the behalf of address(this)
   * @param _signature  Signature byte array associated with _data
   * @return magicValue Magic value 0x20c13b0b if the signature is valid and 0x0 otherwise
   */
  function isValidSignature(
    bytes calldata _data,
    bytes calldata _signature
  ) external override view returns (bytes4) {
    if (_signatureValidation(_hashData(_data), _signature)) {
      // bytes4(keccak256("isValidSignature(bytes,bytes)")
      return 0x20c13b0b;
    }
  }

  /**
   * @notice Verifies whether the provided signature is valid with respect to the provided hash
   * @dev MUST return the correct magic value if the signature provided is valid for the provided hash
   *   > The bytes4 magic value to return when signature is valid is 0x1626ba7e : bytes4(keccak256("isValidSignature(bytes32,bytes)"))
   * @param _hash       keccak256 hash that was signed
   * @param _signature  Signature byte array associated with _data
   * @return magicValue Magic value 0x1626ba7e if the signature is valid and 0x0 otherwise
   */
  function isValidSignature(
    bytes32 _hash,
    bytes calldata _signature
  ) external override view returns (bytes4) {
    if (_signatureValidation(_hash, _signature)) {
      // bytes4(keccak256("isValidSignature(bytes32,bytes)"))
      return 0x1626ba7e;
    }
  }
}

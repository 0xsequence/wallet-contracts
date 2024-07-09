// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "./ModuleAuth.sol";
import "./ModuleUpdate.sol";
import "./ModuleSelfAuth.sol";

import "../../utils/LibClone.sol";
import "../../libs/p256-verifier/WebAuthn.sol";
import "../../Wallet.sol";

/**
 *  Implements ModuleAuth by validating the signature image against
 *  the salt used to deploy the contract
 *
 *  This module allows wallets to be deployed with a default configuration
 *  without using any aditional contract storage
 */
abstract contract ModuleAuthWebAuthnOnly is ModuleSelfAuth, ModuleAuth {
  bytes32 public immutable INIT_CODE_HASH;
  address public immutable FACTORY;

  bytes32 public constant WEBAUTHN_IMAGEHASH = keccak256(
    "Webauthn(uint256 x, uint256 y, bool requireUserValidation, bool requireBackupSanityCheck)"
  );

  error InvalidP256Signature(bytes32 _r, bytes32 _s, bytes32 _x, bytes32 _y);

  constructor(address _factory) {
    // Build init code hash of the deployed wallets using that module
    bytes32 initCodeHash = LibClone.initCodeHash(address(this));

    INIT_CODE_HASH = initCodeHash;
    FACTORY = _factory;
  }

  function _hashWebauthnConfiguration(
    uint256 _x,
    uint256 _y,
    bool _requireUserValidation,
    bool _requireBackupSanityCheck
  ) internal pure returns (bytes32) {
    return keccak256(
      abi.encode(
        WEBAUTHN_IMAGEHASH,
        _x,
        _y,
        _requireUserValidation,
        _requireBackupSanityCheck
      )
    );
  }

  function signatureRecovery(
    bytes32 _digest,
    bytes calldata _signature
  ) public override(ModuleAuth) virtual view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subdigest,
    uint256 checkpoint
  ) {
    (
      bytes memory authenticatorData,
      string memory clientDataJSON,
      uint256 r,
      uint256 s,
      uint256 x,
      uint256 y,
      uint256 packedFlagsAndPointers
    ) = abi.decode(_signature, (bytes, string, uint256, uint256, uint256, uint256, uint256));

    // Decode the packed flag and pointers
    // [
    //  1 byte requireUserValidation
    //  1 byte noChainId,
    //  1 byte requireBackupSanityCheck,
    //  4 bytes challengeLocation,
    //  4 bytes responseTypeLocation
    // ]

    // Extract the flags
    bool requireUserValidation = uint8(packedFlagsAndPointers >> 248) == 1;
    bool noChainId = uint8(packedFlagsAndPointers >> 240) == 1;
    bool requireBackupSanityCheck = uint8(packedFlagsAndPointers >> 232) == 1;
    uint32 challengeLocation = uint32(packedFlagsAndPointers >> 32);
    uint32 responseTypeLocation = uint32(packedFlagsAndPointers);

    // The challenge is the subdigest
    if (noChainId) {
      subdigest = SequenceNoChainIdSig.subdigest(_digest);
    } else {
      subdigest = SequenceBaseSig.subdigest(_digest);
    }

    bytes memory challenge = abi.encodePacked(subdigest);

    // Validate the signature
    if (!WebAuthn.verifySignature(
      challenge,
      authenticatorData,
      requireUserValidation,
      requireBackupSanityCheck,
      clientDataJSON,
      challengeLocation,
      responseTypeLocation,
      r,
      s,
      x,
      y
    )) {
      revert InvalidP256Signature(bytes32(r), bytes32(s), bytes32(x), bytes32(y));
    }

    // The threshold and weight are always 1 and 1
    threshold = 1;
    weight = 1;

    // Checkpoint always zero
    checkpoint = 0;

    // The imageHash is a special case of hashing:
    // - Magic constant
    // - X and Y coordinates of the public key
    // - Require user validation flag
    // - Require backup sanity check flag
    imageHash = _hashWebauthnConfiguration(
      x, y, requireUserValidation, requireBackupSanityCheck
    );
  }

  /**
   * @notice Validates the signature image with the salt used to deploy the contract
   * @param _imageHash Hash image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes32 _imageHash) internal override virtual view returns (bool) {
    return LibClone.predictDeterministicAddress(INIT_CODE_HASH, _imageHash, FACTORY) == address(this);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(bytes4 _interfaceID) public override(ModuleAuth) virtual pure returns (bool) {
    return super.supportsInterface(_interfaceID);
  }
}

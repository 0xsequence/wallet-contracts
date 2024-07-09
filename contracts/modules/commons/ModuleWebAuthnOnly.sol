// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "./ModuleAuth.sol";
import "./ModuleUpdate.sol";
import "./ModuleSelfAuth.sol";

import "../../utils/LibClone.sol";
import "../../utils/LibBytesPointer.sol";
import "../../libs/p256-verifier/WebAuthn.sol";
import "../../Wallet.sol";

/**
 *  Implements ModuleAuth by validating a 1/1 WebAuthn signature
 */
abstract contract ModuleWebAuthnOnly is ModuleSelfAuth, ModuleAuth {
  using LibBytesPointer for bytes;

  bytes32 public immutable INIT_CODE_HASH;
  address public immutable FACTORY;

  bytes32 public constant WEB_AUTHN_IMAGEHASH = keccak256(
    "WebAuthn(uint256 x, uint256 y, bool requireUserValidation, bool requireBackupSanityCheck)"
  );

  error InvalidP256Signature(DecodedSignature decoded);
  error UpdateUnsupported();

  constructor(address _factory) {
    // Build init code hash of the deployed wallets using that module
    bytes32 initCodeHash = LibClone.initCodeHash(address(this));

    INIT_CODE_HASH = initCodeHash;
    FACTORY = _factory;
  }

  function _updateImageHash(bytes32) internal override virtual {
    revert UpdateUnsupported();
  }

  function _hashWebAuthnConfiguration(
    uint256 _x,
    uint256 _y,
    bool _requireUserValidation,
    bool _requireBackupSanityCheck
  ) internal pure returns (bytes32) {
    return keccak256(
      abi.encode(
        WEB_AUTHN_IMAGEHASH,
        _x,
        _y,
        _requireUserValidation,
        _requireBackupSanityCheck
      )
    );
  }

  struct DecodedSignature {
    bytes authenticatorData;
    string clientDataJSON;
    uint256 r;
    uint256 s;
    uint256 x;
    uint256 y;
    bool requireUserValidation;
    bool requireBackupSanityCheck;
    uint256 challengeLocation;
    uint256 responseTypeLocation;
    bool noChainId;
  }

  function _decodeSignature(
    bytes calldata _signature
  ) internal pure returns (
    DecodedSignature memory decoded
  ) {
    unchecked {
      // Read first byte, it contains all booleans
      // The first bit determines if this is a packet or unpacked signature
      // unpacked signatures are less efficient, but it allows expressing a signature
      // that may not fit under the packed format
      if((_signature[0] & 0x80) != 0) {
        // Unpacked signature
        // just use the abi.decode
        (
          bytes memory authenticatorData,
          string memory clientDataJSON,
          uint256 r,
          uint256 s,
          uint256 x,
          uint256 y,
          bool requireUserValidation,
          bool requireBackupSanityCheck,
          uint256 challengeLocation,
          uint256 responseTypeLocation,
          bool noChainId
        ) = abi.decode(_signature[1:], (
          bytes,
          string,
          uint256,
          uint256,
          uint256,
          uint256,
          bool,
          bool,
          uint256,
          uint256,
          bool
        ));

        decoded = DecodedSignature({
          authenticatorData: authenticatorData,
          clientDataJSON: clientDataJSON,
          r: r,
          s: s,
          x: x,
          y: y,
          requireUserValidation: requireUserValidation,
          requireBackupSanityCheck: requireBackupSanityCheck,
          challengeLocation: challengeLocation,
          responseTypeLocation: responseTypeLocation,
          noChainId: noChainId
        });
      } else {
        bytes1 flags = _signature[0];

        // Read the flags
        // 0100 0000 - requireUserValidation
        // 0010 0000 - noChainId
        // 0001 0000 - requireBackupSanityCheck
        decoded.requireUserValidation = (flags & 0x40) != 0;
        decoded.noChainId = (flags & 0x20) != 0;
        decoded.requireBackupSanityCheck = (flags & 0x10) != 0;

        // Packed signature
        uint256 index = 1;

        // Read authenticatorData
        uint256 sizeAuthData; (sizeAuthData, index) = _signature.readUint16(index);
        decoded.authenticatorData = _signature[index:index + sizeAuthData];

        // Read clientDataJSON
        uint256 sizeClientData; (sizeClientData, index) = _signature.readUint16(index + sizeAuthData);
        decoded.clientDataJSON = string(_signature[index:index + sizeClientData]);

        // Read challengeLocation and responseTypeLocation
        (decoded.challengeLocation, index) = _signature.readUint16(index + sizeClientData);
        (decoded.responseTypeLocation, index) = _signature.readUint16(index);

        // Read r, s, x, y
        (decoded.r, index) = _signature.readUint256(index);
        (decoded.s, index) = _signature.readUint256(index);
        (decoded.x, index) = _signature.readUint256(index);
        (decoded.y, index) = _signature.readUint256(index);
      }
    }
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
    DecodedSignature memory decoded = _decodeSignature(_signature);

    // The challenge is the subdigest
    if (decoded.noChainId) {
      subdigest = SequenceNoChainIdSig.subdigest(_digest);
    } else {
      subdigest = SequenceBaseSig.subdigest(_digest);
    }

    bytes memory challenge = abi.encodePacked(subdigest);

    // Validate the signature
    if (!WebAuthn.verifySignature(
      challenge,
      decoded.authenticatorData,
      decoded.requireUserValidation,
      decoded.requireBackupSanityCheck,
      decoded.clientDataJSON,
      decoded.challengeLocation,
      decoded.responseTypeLocation,
      decoded.r,
      decoded.s,
      decoded.x,
      decoded.y
    )) {
      revert InvalidP256Signature(decoded);
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
    imageHash = _hashWebAuthnConfiguration(
      decoded.x, decoded.y, decoded.requireUserValidation, decoded.requireBackupSanityCheck
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

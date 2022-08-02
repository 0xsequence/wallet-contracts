// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;


abstract contract IModuleAuth {
  //                       IMAGE_HASH_KEY = keccak256("org.arcadeum.module.auth.upgradable.image.hash");
  bytes32 internal constant IMAGE_HASH_KEY = bytes32(0xea7157fa25e3aa17d0ae2d5280fa4e24d421c61842aa85e45194e1145aa72bf8);

  event ImageHashUpdated(bytes32 newImageHash);

  // Errors
  error ImageHashIsZero();
  error InvalidSignatureType(bytes1 _type);

  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal virtual view returns (
    bool isValid,
    bytes32 subDigest
  );

  function signatureRecovery(
    bytes32 _digest,
    bytes calldata _signature
  ) public virtual view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    bytes32 subDigest
  );

  /**
   * @notice Validates the signature image
   * @param _imageHash Hashed image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes32 _imageHash) internal virtual view returns (bool);

  /**
   * @notice Updates the signers configuration of the wallet
   * @param _imageHash New required image hash of the signature
   */
  function updateImageHash(bytes32 _imageHash) external virtual;
}

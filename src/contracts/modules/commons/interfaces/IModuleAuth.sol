// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;


abstract contract IModuleAuth {
  //                       IMAGE_HASH_KEY = keccak256("org.arcadeum.module.auth.upgradable.image.hash");
  bytes32 internal constant IMAGE_HASH_KEY = bytes32(0xea7157fa25e3aa17d0ae2d5280fa4e24d421c61842aa85e45194e1145aa72bf8);

  event ImageHashUpdated(bytes32 newImageHash);

  // Errors
  error InvalidNestedSignature(bytes32 _hash, address _addr, bytes _signature);
  error InvalidSignatureFlag(uint256 _flag);
  error InvalidSignatureType(uint256 _type);
  error ImageHashIsZero();

  /**
   * @notice Hashed _data to be signed
   * @param _digest Pre-final digest
   * @param _chainId Chain ID for the subDigest
   * @return hashed data for this wallet
   */
  function _subDigest(
    bytes32 _digest,
    uint256 _chainId
  ) internal virtual view returns (bytes32);

  /**
   * @notice Verify if signer is default wallet owner
   * @param _digest Digest of the signed message
   * @param _signature Encoded signature
   * @return True is the signature is valid
   */
  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal virtual view returns (bool, bytes32);

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

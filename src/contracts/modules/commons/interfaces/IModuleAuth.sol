// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;


abstract contract IModuleAuth {
  // Errors
  error InvalidNestedSignature(bytes32 _hash, address _addr, bytes _signature);
  error InvalidSignatureFlag(uint256 _flag);
  error InvalidSignatureType(uint256 _type);

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
}

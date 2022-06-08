// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;


abstract contract IModuleAuth {
  // Errors
  error InvalidNestedSignature(bytes32 _hash, address _addr, bytes _signature);
  error InvalidSignatureFlag(uint256 _flag);

  /**
   * @notice Hashed _data to be signed
   * @param _digest Pre-final digest
   * @return hashed data for this wallet
   */
  function _subDigest(
    bytes32 _digest
  ) internal virtual view returns (bytes32);

  /**
   * @notice Verify if signer is default wallet owner
   * @param _hash Hashed signed message
   * @param _signature Encoded signature
   * @return True is the signature is valid
   */
  function _signatureValidation(
    bytes32 _hash,
    bytes memory _signature
  ) internal virtual view returns (bool);
}

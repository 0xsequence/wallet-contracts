// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;


abstract contract IModuleAuth {
  /**
   * @notice Hashed _data to be signed
   * @param _data Data to be hashed
   * @return hashed data for this wallet
   */
  function _hashData(
    bytes memory _data
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

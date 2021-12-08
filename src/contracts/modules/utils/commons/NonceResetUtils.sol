// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;

import "../../commons/ModuleStorage.sol";


contract NonceResetUtils {
  //                       NONCE_KEY = keccak256("org.arcadeum.module.calls.nonce");
  bytes32 internal constant NONCE_KEY = bytes32(0x8d0bf1fd623d628c741362c1289948e57b3e2905218c676d3e69abee36d6ae2e);

  event ResetNonce(uint256 _space);

  /**
   * @notice Changes the current nonce of the given nonce space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @param _nonce Nonce to write to the space
   */
  function _writeNonce(uint256 _space, uint256 _nonce) internal {
    ModuleStorage.writeBytes32Map(NONCE_KEY, bytes32(_space), bytes32(_nonce));
  }

  /**
   * @notice Resets the current nonce of the given nonce space back to 0
   * @param _space Nonce space, each space keeps an independent nonce count
   */
  function _resetNonce(uint256 _space) internal {
    // Set nonce back to 0
    _writeNonce(_space, 0);

    // Emit event
    emit ResetNonce(_space);
  }
}

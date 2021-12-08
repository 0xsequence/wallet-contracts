// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;

import "../../commons/ModuleStorage.sol";


contract GapNonceUtils {
  event GapNonceChange(uint256 _space, uint256 _oldNonce, uint256 _newNonce);

  //                       GAP_NONCE_KEY = keccak256("org.sequence.module.gapnonce.nonce");
  bytes32 internal constant GAP_NONCE_KEY = bytes32(keccak256("org.sequence.module.gapnonce.nonce"));

  /**
   * @notice Returns the current nonce for a given gap space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @return The current nonce
   */
  function _readGapNonce(uint256 _space) internal view returns (uint256) {
    return uint256(ModuleStorage.readBytes32Map(GAP_NONCE_KEY, bytes32(_space)));
  }

  /**
   * @notice Changes the gap nonce of the given space
   * @param _space Nonce space, each space keeps an independent nonce count
   * @param _nonce Nonce to write to the space
   */
  function _writeGapNonce(uint256 _space, uint256 _nonce) internal {
    ModuleStorage.writeBytes32Map(GAP_NONCE_KEY, bytes32(_space), bytes32(_nonce));
  }

  /**
   * @notice Requires current nonce to be below the value provided, updates the current nonce
   * @dev Throws if the current nonce is not below the value provided
   * @param _space Nonce space, each space keeps an independent nonce count
   * @param _nonce Nonce to check against the current nonce
   */
  function _requireGapNonce(uint256 _space, uint256 _nonce) internal {
    // Read the current nonce
    uint256 currentNonce = _readGapNonce(_space);

    // Verify that the provided nonce
    // is above the current nonce
    require(
      _nonce > currentNonce,
      "GapNonceUtils#_requireGapNonce: INVALID_NONCE"
    );

    // Store new nonce value
    _writeGapNonce(_space, _nonce);

    // Emit event
    emit GapNonceChange(_space, currentNonce, _nonce);
  }
}

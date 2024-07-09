// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


/**
 * Helper library for external contracts to verify P256 signatures.
 * Provided by: https://github.com/Vectorized/solady/blob/main/src/utils/P256.sol
 **/
library P256 {
  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                        CUSTOM ERRORS                       */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @dev Unable to verify the P256 signature, due to missing
  /// RIP-7212 P256 verifier precompile and missing Daimo P256 verifier.
  error P256VerificationFailed();

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                         CONSTANTS                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @dev Address of the Daimo P256 verifier.
  address internal constant VERIFIER = 0xc2b78104907F722DABAc4C69f826a522B2754De4;

  /// @dev Address of the RIP-7212 P256 verifier precompile.
  /// Currently, we don't support EIP-7212's precompile at 0x0b as it has not been finalized.
  /// See: https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md
  address internal constant RIP_PRECOMPILE = 0x0000000000000000000000000000000000000100;

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                P256 VERIFICATION OPERATIONS                */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @dev Returns if the signature (`r`, `s`) is valid for `hash` and public key (`x`, `y`).
  /// Does NOT include the malleability check.
  function verifySignature(
      bytes32 hash,
      uint256 r,
      uint256 s,
      uint256 x,
      uint256 y
  ) internal view returns (bool isValid) {
    /// @solidity memory-safe-assembly
    assembly {
      let m := mload(0x40)
      mstore(m, hash)
      mstore(add(m, 0x20), r)
      mstore(add(m, 0x40), s)
      mstore(add(m, 0x60), x)
      mstore(add(m, 0x80), y)
      let success := staticcall(gas(), RIP_PRECOMPILE, m, 0xa0, 0x00, 0x20)
      // `returndatasize` is `0x20` if verifier exists and sufficient gas, else `0x00`.
      if iszero(returndatasize()) {
        // The verifier may actually revert, as it has `abi.decode` and `assert`.
        success := staticcall(gas(), VERIFIER, m, 0xa0, returndatasize(), 0x20)
        if iszero(returndatasize()) {
          mstore(returndatasize(), 0xd0d5039b) // `P256VerificationFailed()`.
          revert(0x1c, 0x04)
        }
      }
      isValid := and(eq(1, mload(0x00)), success)
    }
  }
}

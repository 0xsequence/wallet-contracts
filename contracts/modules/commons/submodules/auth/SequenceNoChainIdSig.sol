// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


library SequenceNoChainIdSig {

  /**
   * @notice Computes a subdigest for a Sequence signature that works on all chains.
   * @dev The subdigest is computed by removing the chain ID from the digest (using 0 instead).
   * @param _digest The digest of the chain of signatures.
   * @return bytes32 The subdigest with no chain ID.
   */
  function subdigest(bytes32 _digest) internal view returns (bytes32) {
    return keccak256(
      abi.encodePacked(
        "\x19\x01",
        uint256(0),
        address(this),
        _digest
      )
    );
  }
}

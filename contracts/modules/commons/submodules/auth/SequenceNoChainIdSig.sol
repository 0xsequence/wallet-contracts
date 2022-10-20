// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;


library SequenceNoChainIdSig {
  function subDigest(bytes32 _digest) internal view returns (bytes32) {
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

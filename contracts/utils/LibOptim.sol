// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;


library LibOptim {
  /**
    @notice Implements `keccak256(abi.encodePacked(bytes32, bytes32))` using only scratch memory space.

    @param _a First 32 bytes of the hash.
    @param _b Second 32 bytes of the hash.

    @return c The keccak256 hash of the two 32-byte inputs.
  */
  function fkeccak256(
    bytes32 _a,
    bytes32 _b
  ) internal pure returns (bytes32 c) {
    assembly {
      mstore(0, _a)
      mstore(32, _b)
      c := keccak256(0, 64)
    }
  }
}

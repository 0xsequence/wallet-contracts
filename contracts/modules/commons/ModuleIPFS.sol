// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./ModuleSelfAuth.sol";
import "./ModuleStorage.sol";

import "../../utils/LibString.sol";


contract ModuleIPFS is ModuleSelfAuth {
  event IPFSRootUpdated(bytes32 _hash);

  //                       IPFS_ROOT_KEY = keccak256("sequence.ipfs.root")
  bytes32 private constant IPFS_ROOT_KEY = bytes32(0x0eecac93ced8722d209199364cda3bc33da3bc3a23daef6be49ebd780511d033);

  function ipfsRootBytes32() public view returns (bytes32) {
    return ModuleStorage.readBytes32(IPFS_ROOT_KEY);
  }

  function ipfsRoot() public view returns (string memory) {
    return string(
      abi.encodePacked(
        "ipfs://",
        LibString.prefixBase32(
          LibString.bytesToBase32(
            abi.encodePacked(
              hex'01701220',
              ipfsRootBytes32()
            )
          )
        )
      )
    );
  }

  function updateIPFSRoot(bytes32 _hash) external onlySelf {
    _updateIPFSRoot(_hash);
  }

  function _updateIPFSRoot(bytes32 _hash) internal {
    ModuleStorage.writeBytes32(IPFS_ROOT_KEY, _hash);
    emit IPFSRootUpdated(_hash);
  }
}

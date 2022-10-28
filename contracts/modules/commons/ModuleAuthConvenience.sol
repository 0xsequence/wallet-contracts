// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;

import "./ModuleSelfAuth.sol";
import "./ModuleAuth.sol";
import "./ModuleIPFS.sol";

import "../../utils/LibString.sol";


abstract contract ModuleAuthConvenience is ModuleSelfAuth, ModuleAuth, ModuleIPFS {
  function updateImageHashAndIPFS(
    bytes32 _imageHash,
    bytes32 _ipfsRoot
  ) external onlySelf {
    _updateImageHash(_imageHash);
    _updateIPFSRoot(_ipfsRoot);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./ModuleSelfAuth.sol";
import "./ModuleAuth.sol";
import "./ModuleIPFS.sol";
import "./ModuleERC165.sol";

import "../../utils/LibString.sol";



abstract contract ModuleAuthConvenience is ModuleERC165, ModuleSelfAuth, ModuleAuth, ModuleIPFS {

  /**
  * @notice Updates the image hash and the IPFS root in a single operation.
  * @dev These two operations are often performed together, so this function
  *      allows to save some gas by performing them in a single step.
  *
  * @param _imageHash The new image hash to be set.
  * @param _ipfsRoot The new IPFS root to be set.
  */
  function updateImageHashAndIPFS(
    bytes32 _imageHash,
    bytes32 _ipfsRoot
  ) external onlySelf {
    _updateImageHash(_imageHash);
    _updateIPFSRoot(_ipfsRoot);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(bytes4 _interfaceID) public override (
    ModuleERC165,
    ModuleAuth
  ) virtual pure returns (bool) {
    if (_interfaceID == type(ModuleAuthConvenience).interfaceId) {
      return true;
    }

    return super.supportsInterface(_interfaceID);
  }
}

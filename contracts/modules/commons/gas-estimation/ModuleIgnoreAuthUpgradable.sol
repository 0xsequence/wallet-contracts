// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./../ModuleAuthUpgradable.sol";


/**
  @notice Implements ModuleAuthUpgradable but ignores the validity of the signature
    should only be used during gas estimation.
*/
abstract contract ModuleIgnoreAuthUpgradable is ModuleAuthUpgradable {
  /**
   * @notice Removes the signature validation from the module, by returning true for any _imageHash
   * @param _imageHash Hash image of signature
   * @return true always
   */
  function _isValidImage(bytes32 _imageHash) internal override(ModuleAuthUpgradable) virtual view returns (bool) {
    // Still validates the imageHash using the original mechanism for a more acurate estimation
    return super._isValidImage(_imageHash) || true;
  }
}

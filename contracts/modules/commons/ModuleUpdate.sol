pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "./Implementation.sol";
import "./ModuleBase.sol";

contract ModuleUpdate is ModuleBase, Implementation {
  /**
   * @notice Updates the implementation of the base wallet
   * @param _implementation New main module implementation
   * @dev WARNING Updating the implementation can brick the wallet
   */
  function updateImplementation(address _implementation) external onlySelf {
    require(_implementation != address(0), "ModuleUpdate#updateImplementation: INVALID_IMPLEMENTATION");
    _setImplementation(_implementation);
  }
}

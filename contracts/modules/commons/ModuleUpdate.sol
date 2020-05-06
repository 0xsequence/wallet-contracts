pragma solidity ^0.6.7;
pragma experimental ABIEncoderV2;

import "./Implementation.sol";
import "./ModuleSelfAuth.sol";

import "../../utils/LibAddress.sol";


contract ModuleUpdate is ModuleSelfAuth, Implementation {
  using LibAddress for address;

  /**
   * @notice Updates the implementation of the base wallet
   * @param _implementation New main module implementation
   * @dev WARNING Updating the implementation can brick the wallet
   */
  function updateImplementation(address _implementation) external onlySelf {
    require(_implementation.isContract(), "ModuleUpdate#updateImplementation: INVALID_IMPLEMENTATION");
    _setImplementation(_implementation);
  }
}

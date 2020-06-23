pragma solidity ^0.6.8;

/**
 * @dev Allows modules to access the implementation slot
 */
contract Implementation {
  /**
   * @notice Updates the Wallet implementation
   * @param _imp New implementation address
   * @dev The wallet implementation is stored on the storage slot
   *   defined by the address of the wallet itself
   *   WARNING updating this value may break the wallet
   */
  function _setImplementation(address _imp) internal {
    assembly {
      sstore(address(), _imp)
    }
  }

  /**
   * @notice Returns the Wallet implementation
   * @return _imp The address of the current Wallet implementation
   */
  function _getImplementation() internal view returns (address _imp) {
    assembly {
      _imp := sload(address())
    }
  }
}

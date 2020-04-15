pragma solidity ^0.6.5;

import "./ModuleAuth.sol";

/**
 *  Implements ModuleAuth by validating the signature image against
 *  the salt used to deploy the contract
 *
 *  This module allows wallets to be deployed with a default configuration
 *  without using any aditional contract storage
 */
abstract contract ModuleAuthFixed is ModuleAuth {
  bytes32 public immutable INIT_CODE_HASH;
  address public immutable FACTORY;

  constructor(bytes32 _initCodeHash, address _factory) public {
    INIT_CODE_HASH = _initCodeHash;
    FACTORY = _factory;
  }

  /**
   * @notice Validates the signature image with the salt used to deploy the contract
   * @param _image Image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes memory _image) internal override view returns (bool) {
    return address(
      uint256(
        keccak256(
          abi.encodePacked(
            byte(0xff),
            FACTORY,
            keccak256(_image),
            INIT_CODE_HASH
          )
        )
      )
    ) == address(this);
  }
}

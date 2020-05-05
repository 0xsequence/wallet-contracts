pragma solidity ^0.6.7;

import "./ModuleAuth.sol";
import "../../Wallet.sol";

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

  constructor(address _factory) public {
    // Build init code hash of the deployed wallets using that module
    bytes32 initCodeHash = keccak256(abi.encodePacked(Wallet.creationCode, uint256(address(this))));

    INIT_CODE_HASH = initCodeHash;
    FACTORY = _factory;
  }

  /**
   * @notice Validates the signature image with the salt used to deploy the contract
   * @param _imageHash Hash image of signature
   * @return true if the signature image is valid
   */
  function _isValidImage(bytes32 _imageHash) internal override view returns (bool) {
    return address(
      uint256(
        keccak256(
          abi.encodePacked(
            byte(0xff),
            FACTORY,
            _imageHash,
            INIT_CODE_HASH
          )
        )
      )
    ) == address(this);
  }

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID`
   */
  function supportsInterface(bytes4 _interfaceID) public override virtual view returns (bool) {
    if (
      _interfaceID == this.INIT_CODE_HASH.selector ||
      _interfaceID == this.FACTORY.selector
    ) {
      return true;
    }

    return super.supportsInterface(_interfaceID);
  }
}

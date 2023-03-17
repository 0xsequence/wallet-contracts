// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./ModuleAuth.sol";
import "./ModuleStorage.sol";
import "./ModuleSelfAuth.sol";
import "./ModuleERC165.sol";


abstract contract ModuleExtraAuth is ModuleERC165, ModuleSelfAuth, ModuleAuth {
  //                       EXTRA_IMAGE_HASH_KEY = keccak256("org.sequence.module.static.auth.extra.image.hash");
  bytes32 private constant EXTRA_IMAGE_HASH_KEY = bytes32(0x849e7bdc245db17e50b9f43086f1914d70eb4dab6dd89af4d541d53353ad97de);

  event SetExtraImageHash(bytes32 indexed _imageHash, uint256 _expiration);

  function _writeExpirationForImageHash(bytes32 _imageHash, uint256 _expiration) internal {
    ModuleStorage.writeBytes32Map(EXTRA_IMAGE_HASH_KEY, _imageHash, bytes32(_expiration));
  }

  function _readExpirationForImageHash(bytes32 _imageHash) internal view returns (uint256 _expiration) {
    return uint256(ModuleStorage.readBytes32Map(EXTRA_IMAGE_HASH_KEY, _imageHash));
  }

  function _isValidImage(bytes32 _imageHash) internal override virtual view returns (bool) {
    if (super._isValidImage(_imageHash)) {
      return true;
    }

    uint256 expiration = _readExpirationForImageHash(_imageHash);

    // solhint-disable-next-line not-rely-on-time
    return expiration != 0 && expiration > block.timestamp;
  }

  function extraImageHash(bytes32 _imageHash) public view returns (uint256) {
    return _readExpirationForImageHash(_imageHash);
  }

  function setExtraImageHash(bytes32 _imageHash, uint256 _expiration) external onlySelf {
    _writeExpirationForImageHash(_imageHash, _expiration);

    emit SetExtraImageHash(_imageHash, _expiration);
  }

  function clearExtraImageHashes(bytes32[] calldata _imageHashes) external onlySelf {
    unchecked {
      uint256 imageHashesLength = _imageHashes.length;
      for (uint256 i = 0; i < imageHashesLength; i++) {
        bytes32 imageHash = _imageHashes[i];
        _writeExpirationForImageHash(imageHash, 0);

       emit SetExtraImageHash(imageHash, 0);
      }
    }
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
    if (_interfaceID == type(ModuleExtraAuth).interfaceId) {
      return true;
    }

    return super.supportsInterface(_interfaceID);
  }
}

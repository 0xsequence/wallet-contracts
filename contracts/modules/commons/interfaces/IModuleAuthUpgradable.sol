pragma solidity ^0.6.7;


interface IModuleAuthUpgradable {
  /**
   * @notice Updates the signers configuration of the wallet
   * @param _imageHash New required image hash of the signature
   */
  function updateImageHash(bytes32 _imageHash) external;

  /**
   * @notice Returns the current image hash of the wallet
   */
  function imageHash() external view returns (bytes32);
}

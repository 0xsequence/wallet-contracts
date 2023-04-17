// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/Factory.sol";
import "contracts/modules/commons/ModuleCalls.sol";
import "contracts/modules/utils/RequireUtils.sol";

import "foundry_test/base/AdvTest.sol";

contract ModuleCallsImp is ModuleCalls {

  function writeNonce(uint256 _space, uint256 _nonce) external {
    _writeNonce(_space, _nonce);
  }

  // Module Auth imp
  mapping(bytes32 => mapping(bytes => bytes32)) public sigToSubdigest;
  mapping(bytes32 => mapping(bytes => bool)) public sigToIsValid;

  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal override view returns (
    bool,
    bytes32
  ) {
   
  }

  function signatureRecovery(bytes32, bytes calldata) public override view returns (
    uint256, uint256, bytes32, bytes32, uint256
  ) {
  }

  function _isValidImage(bytes32) internal override view returns (bool) {
  }

  function updateImageHash(bytes32) external override {
  }

  function _updateImageHash(bytes32) internal override {
  }
}

contract SubModuleNonceTest is AdvTest {
  ModuleCallsImp private imp;
  RequireUtils private requireUtils;
  
  function setUp() external {
    requireUtils = new RequireUtils();
    ModuleCallsImp template = new ModuleCallsImp();
    Factory factory = new Factory();
    imp = ModuleCallsImp(factory.deploy(address(template), bytes32(0)));
  }

  function test_requireNonExpired(uint256 _expiration) external {
    if (block.timestamp > _expiration) {
      vm.expectRevert(bytes('RequireUtils#requireNonExpired: EXPIRED'));
    }
    requireUtils.requireNonExpired(_expiration);
  }

  function test_requireNonExpiredWithExactBlock(uint256 _expiration) external {
    requireUtils.requireNonExpired(block.timestamp);
  }

  function test_requireMinNonce(uint160 _space, uint96 _nonce, uint96 _nonceToCheck) external {
    imp.writeNonce(_space, _nonce);
    uint256 encoded = abi.decode(abi.encodePacked(_space, _nonceToCheck), (uint256));
    if (_nonce < _nonceToCheck) {
      vm.expectRevert(bytes('RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED'));
    }
    requireUtils.requireMinNonce(address(imp), encoded);
  }

  function test_requireMinNonceWithExactNonce(uint160 _space, uint96 _nonce) external {
    imp.writeNonce(_space, _nonce);
    uint256 encoded = abi.decode(abi.encodePacked(_space, _nonce), (uint256));
    requireUtils.requireMinNonce(address(imp), encoded);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/Factory.sol";
import "contracts/modules/commons/ModuleCalls.sol";
import "contracts/modules/utils/RequireUtils.sol";

import "contracts/mocks/ERC20Mock.sol";
import "contracts/mocks/ERC721Mock.sol";
import "contracts/mocks/ERC1155Mock.sol";

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

contract RequireUtilsTest is AdvTest {
  ModuleCallsImp private imp;
  RequireUtils private requireUtils;
  ERC20Mock private erc20;
  ERC721Mock private erc721;
  ERC1155Mock private erc1155;
  
  function setUp() external {
    requireUtils = new RequireUtils();
    ModuleCallsImp template = new ModuleCallsImp();
    Factory factory = new Factory();
    imp = ModuleCallsImp(factory.deploy(address(template), bytes32(0)));
    erc20 = new ERC20Mock(1000 * 10 ** 18);
    erc721 = new ERC721Mock();
    erc1155 = new ERC1155Mock();
  }

  function test_requireNonExpired(uint256 _expiration) external {
    if (block.timestamp >= _expiration) {
      vm.expectRevert(bytes('RequireUtils#requireNonExpired: EXPIRED'));
    }
    requireUtils.requireNonExpired(_expiration);
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

  function test_requireMinERC20Balance(uint256 _minBalance) external {
    uint256 balance = erc20.balanceOf(address(this));

    if (balance < _minBalance) {
      vm.expectRevert(bytes('RequireUtils#requireMinERC20Balance: BALANCE_TOO_LOW'));
    }
    requireUtils.requireMinERC20Balance(address(erc20), address(this), _minBalance);
  }

  function test_requireMinERC20Allowance(uint256 _minAllowance) external {
    erc20.approve(address(imp), 100 * 10 ** 18);

    uint256 allowance = erc20.allowance(address(this), address(imp));

    if (allowance < _minAllowance) {
      vm.expectRevert(bytes('RequireUtils#requireMinERC20Allowance: ALLOWANCE_TOO_LOW'));
    }
    requireUtils.requireMinERC20Allowance(address(erc20), address(this), address(imp), _minAllowance);
  }

  function test_requireERC721Ownership(uint256 _tokenId) external {
    if (_tokenId % 2 == 0) {
      erc721.mint(address(imp), _tokenId);
    } else {
      erc721.mint(address(this), _tokenId);
    }

    if (erc721.ownerOf(_tokenId) != address(this)) {
      vm.expectRevert(bytes('RequireUtils#requireERC721Ownership: NOT_OWNER'));
    }
    requireUtils.requireERC721Ownership(address(erc721), address(this), _tokenId);
  }

  function test_requireERC721Approval(uint256 _tokenId) external {
    erc721.mint(address(this), _tokenId);

    if (_tokenId % 2 == 0) {
      erc721.approve(address(imp), _tokenId); 
    }

    if (_tokenId % 5 == 0) {
      erc721.setApprovalForAll(address(imp), true);
    }

    address approved = erc721.getApproved(_tokenId);

    if (approved != address(imp) && !erc721.isApprovedForAll(address(this), address(imp))) {
      vm.expectRevert(bytes('RequireUtils#requireERC721Approval: NOT_APPROVED'));
    }
    requireUtils.requireERC721Approval(address(erc721), address(this), address(imp), _tokenId);
  }

  function test_requireMinERC1155Balance(uint256 _tokenId, uint256 _minBalance) external {
    if (_tokenId % 2 == 0) {
      erc1155.mint(address(this), _tokenId, _minBalance); 
    }

    uint256 balance = erc1155.balanceOf(address(this), _tokenId);

    if (balance < _minBalance) {
      vm.expectRevert(bytes('RequireUtils#requireMinERC1155Balance: BALANCE_TOO_LOW'));
    }
    requireUtils.requireMinERC1155Balance(address(erc1155), address(this), _tokenId, _minBalance);
  }

  function test_requireERC1155Approval(uint256 _tokenId) external {
    if (_tokenId % 2 == 0) {
      erc1155.setApprovalForAll(address(imp), true); 
    }

    if (!erc1155.isApprovedForAll(address(this), address(imp))) {
      vm.expectRevert(bytes('RequireUtils#requireERC1155Approval: NOT_APPROVED'));
    }
    requireUtils.requireERC1155Approval(address(erc1155), address(this), address(imp));
  }
}
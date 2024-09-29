// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import 'contracts/hooks/EIP4337Hook.sol';
import 'contracts/hooks/interfaces/IEIP4337Hook.sol';
import 'contracts/modules/commons/ModuleAuth.sol';
import 'contracts/modules/commons/ModuleCalls.sol';
import 'contracts/modules/commons/ModuleHooks.sol';
import 'contracts/modules/MainModule.sol';
import 'contracts/modules/MainModuleUpgradable.sol';
import 'contracts/Factory.sol';

import 'foundry_test/base/AdvTest.sol';

contract MockModules is ModuleAuth, ModuleCalls, ModuleHooks {
  function validateNonce(uint256 _rawNonce) external {
    _validateNonce(_rawNonce);
  }

  function writeNonce(uint256 _space, uint256 _nonce) external {
    _writeNonce(_space, _nonce);
  }

  // Module Auth imp
  mapping(bytes32 => mapping(bytes => bytes32)) public sigToSubdigest;
  mapping(bytes32 => mapping(bytes => bool)) public sigToIsValid;

  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal view override(IModuleAuth, ModuleAuth) returns (bool isValid, bytes32 subdigest) {
    subdigest = sigToSubdigest[_digest][_signature];
    isValid = sigToIsValid[_digest][_signature];
  }

  function mockSignature(bytes32 _digest, bytes calldata _signature, bytes32 _subdigest, bool _isValid) external {
    sigToSubdigest[_digest][_signature] = _subdigest;
    sigToIsValid[_digest][_signature] = _isValid;
  }

  // solhint-disable no-empty-blocks
  function _isValidImage(bytes32) internal view override returns (bool) {}

  function _updateImageHash(bytes32) internal override {}

  // solhint-enable no-empty-blocks

  function supportsInterface(
    bytes4 _interfaceID
  ) public pure virtual override(ModuleAuth, ModuleCalls, ModuleHooks) returns (bool) {
    return
      ModuleAuth.supportsInterface(_interfaceID) ||
      ModuleCalls.supportsInterface(_interfaceID) ||
      ModuleHooks.supportsInterface(_interfaceID);
  }
}

contract EIP4337HookTest is AdvTest, IEIP4337HookErrors {
  MockModules private walletMod;
  EIP4337Hook private wallet;

  address private constant ENTRYPOINT = address(uint160(uint256(keccak256('entrypoint'))));

  function setUp() external {
    Factory factory = new Factory();
    ModuleHooks template = new MockModules();
    walletMod = MockModules(payable(factory.deploy(address(template), bytes32(0))));
    EIP4337Hook hook = new EIP4337Hook(ENTRYPOINT);

    // Add hooks
    vm.startPrank(address(walletMod));
    walletMod.addHook(IAccount.validateUserOp.selector, address(hook));
    walletMod.addHook(IEIP4337Hook.eip4337SelfExecute.selector, address(hook));
    vm.stopPrank();

    wallet = EIP4337Hook(address(walletMod));
    vm.label(address(wallet), 'wallet');
  }

  struct ToVal {
    address target;
    uint256 value;
  }

  //
  // Execute
  //

  function test_4337execute_invalidCaller(ToVal memory sendTx, address sender) external {
    vm.assume(sender != ENTRYPOINT);
    IModuleCalls.Transaction[] memory txs = new IModuleCalls.Transaction[](1);
    txs[0] = IModuleCalls.Transaction({
      delegateCall: false,
      revertOnError: false,
      gasLimit: 0,
      target: sendTx.target,
      value: sendTx.value,
      data: ''
    });

    vm.expectRevert(InvalidCaller.selector);
    vm.prank(sender);
    wallet.eip4337SelfExecute(txs);
  }

  function test_4337execute_sendEth(ToVal memory sendTx) external {
    _assumeSafeAddress(sendTx.target);
    uint256 targetBal = sendTx.target.balance;

    // Give wallet exact funds
    vm.deal(address(wallet), sendTx.value);

    IModuleCalls.Transaction[] memory txs = new IModuleCalls.Transaction[](1);
    txs[0] = IModuleCalls.Transaction({
      delegateCall: false,
      revertOnError: true,
      gasLimit: 0,
      target: sendTx.target,
      value: sendTx.value,
      data: ''
    });

    vm.prank(ENTRYPOINT);
    wallet.eip4337SelfExecute(txs);

    assertEq(address(wallet).balance, 0);
    assertEq(sendTx.target.balance, targetBal + sendTx.value);
  }

  function test_4337execute_insufficientEth(ToVal memory sendTx) external {
    _assumeSafeAddress(sendTx.target);
    vm.assume(sendTx.value > 0);

    IModuleCalls.Transaction[] memory txs = new IModuleCalls.Transaction[](1);
    txs[0] = IModuleCalls.Transaction({
      delegateCall: false,
      revertOnError: true,
      gasLimit: 0,
      target: sendTx.target,
      value: sendTx.value,
      data: ''
    });

    vm.expectRevert();
    vm.prank(ENTRYPOINT);
    wallet.eip4337SelfExecute(txs);
  }

  //
  // Validate
  //

  function test_4337validateUserOp_invalidCaller(
    IAccount.UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 missingAccountFunds
  ) external {
    vm.expectRevert(InvalidCaller.selector);
    wallet.validateUserOp(userOp, userOpHash, missingAccountFunds);
  }

  function test_4337validateUserOp(
    IAccount.UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 missingAccountFunds
  ) external {
    // Give wallet enough funds
    vm.deal(address(wallet), missingAccountFunds);

    // Accept the hash
    bytes32 encodedHash = keccak256(abi.encodePacked('\x19Ethereum Signed Message:\n32', userOpHash));
    walletMod.mockSignature(encodedHash, userOp.signature, bytes32(0), true);

    // Validate
    vm.prank(ENTRYPOINT);
    uint256 validationData = wallet.validateUserOp(userOp, userOpHash, missingAccountFunds);

    assertEq(validationData, 0);
  }

  function test_4337validateUserOp_failedSignature(
    IAccount.UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 missingAccountFunds
  ) external {
    // Give wallet enough funds
    vm.deal(address(wallet), missingAccountFunds);

    // Validate
    vm.prank(ENTRYPOINT);
    uint256 validationData = wallet.validateUserOp(userOp, userOpHash, missingAccountFunds);

    assertEq(validationData, 1);
  }

  function test_4337validateUserOp_invalidFunds(
    IAccount.UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 missingAccountFunds
  ) external {
    // Accept the hash
    bytes32 encodedHash = keccak256(abi.encodePacked('\x19Ethereum Signed Message:\n32', userOpHash));
    walletMod.mockSignature(encodedHash, userOp.signature, bytes32(0), true);

    // Validate
    vm.prank(ENTRYPOINT);
    uint256 validationData = wallet.validateUserOp(userOp, userOpHash, missingAccountFunds);

    // Passes. Account doesn't validate
    assertEq(validationData, 0);
  }

  //
  // Helpers
  //

  function _assumeSafeAddress(address addr) private view {
    vm.assume(uint160(addr) > 20); // Non precompiled
    vm.assume(addr.code.length == 0); // Non contract
  }
}

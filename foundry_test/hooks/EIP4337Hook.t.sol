// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import 'contracts/hooks/EIP4337Hook.sol';
import 'contracts/modules/commons/ModuleHooks.sol';
import 'contracts/modules/MainModule.sol';
import 'contracts/modules/MainModuleUpgradable.sol';
import 'contracts/Factory.sol';

import 'foundry_test/base/AdvTest.sol';

contract EIP4337HookTest is AdvTest {
  MainModule private template;
  EIP4337Hook private wallet;

  address private constant ENTRYPOINT = address(uint160(uint256(keccak256('entrypoint'))));

  function setUp() external {
    Factory factory = new Factory();
    address upgradeable = address(new MainModuleUpgradable());
    template = new MainModule(address(factory), upgradeable);
    ModuleHooks walletMod = ModuleHooks(payable(factory.deploy(address(template), bytes32(0)))); // Add hook below
    vm.label(address(walletMod), "wallet");
    EIP4337Hook hook = new EIP4337Hook(ENTRYPOINT);

    // Fund wallet
    vm.deal(address(walletMod), 10 ether);

    // Add hooks
    vm.startPrank(address(walletMod));
    walletMod.addHook(IAccount.validateUserOp.selector, address(hook));
    walletMod.addHook(IEIP4337Hook.eip4337SelfExecute.selector, address(hook));
    vm.stopPrank();

    wallet = EIP4337Hook(address(walletMod));
  }

  struct ToVal {
    address target;
    uint256 value;
  }

  function test_execute_sendEth(ToVal memory sendTx) external {
    vm.assume(sendTx.target.code.length == 0); // Non contract
    uint256 walletBal = address(wallet).balance;
    vm.assume(sendTx.value <= walletBal);

    IModuleCalls.Transaction[] memory txs = new IModuleCalls.Transaction[](1);
    txs[0] = IModuleCalls.Transaction({
      delegateCall: false,
      revertOnError: false,
      gasLimit: 0,
      target: sendTx.target,
      value: sendTx.value,
      data: ''
    });

    vm.prank(ENTRYPOINT);
    wallet.eip4337SelfExecute(txs);

    assertEq(address(wallet).balance, walletBal - sendTx.value);
    assertEq(sendTx.target.balance, sendTx.value);
  }

  function test_validateUserOp(ToVal[] memory sendTx) external {}
}

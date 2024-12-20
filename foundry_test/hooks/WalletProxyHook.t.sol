// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import 'contracts/hooks/WalletProxyHook.sol';
import 'contracts/hooks/interfaces/IWalletProxy.sol';
import 'contracts/modules/commons/ModuleHooks.sol';
import 'contracts/Factory.sol';

import 'foundry_test/base/AdvTest.sol';

contract WalletProxyHookTest is AdvTest {
  ModuleHooks private template;
  ModuleHooks private walletMod;
  WalletProxyHook private wallet;

  function setUp() external {
    Factory factory = new Factory();
    template = new ModuleHooks();
    walletMod = ModuleHooks(payable(factory.deploy(address(template), bytes32(0))));
    WalletProxyHook hook = new WalletProxyHook();

    // Add hook
    vm.prank(address(walletMod));
    walletMod.addHook(IWalletProxy.PROXY_getImplementation.selector, address(hook));

    wallet = WalletProxyHook(address(walletMod));
    vm.label(address(wallet), 'wallet');
  }

  //
  // Get Implementation
  //

  function test_PROXY_getImplementation() external {
    assertEq(wallet.PROXY_getImplementation(), address(template));
  }
}

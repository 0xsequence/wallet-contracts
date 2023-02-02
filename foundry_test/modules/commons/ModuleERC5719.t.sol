// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/modules/commons/ModuleERC5719.sol";

import "foundry_test/base/AdvTest.sol";

contract ModuleERC5719Test is AdvTest {
  ModuleERC5719 private module;

  function setUp() public {
    module = new ModuleERC5719();
  }

  function test_getAlternativeSignature() external {
    // 0xba5a3cbb592813d90eae65a3aac33e9b6dfc7be50623aa25e151fe3da06c8443
    // ==
    // ipfs://bafybeif2li6lwwjicpmq5ltfuovmgpu3nx6hxzigeovclykr7y62a3eeim

    // 0xb6f77d000c8791676d96aedac165dd1bb2da4a5baf78198b9f391fc76b893f46
    // ==
    // ipfs://bafybeifw656qadehsftw3fvo3lawlxi3wlneuw5ppamyxhzzd7dwxcj7iy

    vm.startPrank(address(module));

    bytes32 root = 0xba5a3cbb592813d90eae65a3aac33e9b6dfc7be50623aa25e151fe3da06c8443;
    module.updateIPFSRoot(root);

    assertEq(
      module.getAlternativeSignature(0x64f16a2f2c80ab7f3b0e0edc67c0bf1399402dc389cfb4271ba58abe3f61ea16),
      'ipfs://bafybeif2li6lwwjicpmq5ltfuovmgpu3nx6hxzigeovclykr7y62a3eeim/ERC5719/0x64f16a2f2c80ab7f3b0e0edc67c0bf1399402dc389cfb4271ba58abe3f61ea16'
    );

    root = 0xb6f77d000c8791676d96aedac165dd1bb2da4a5baf78198b9f391fc76b893f46;
    module.updateIPFSRoot(root);

    assertEq(
      module.getAlternativeSignature(0x11b858b3b52eb84e900639ebb082aeacb10bd9d239f58ae3f7092885cc3593b6),
      'ipfs://bafybeifw656qadehsftw3fvo3lawlxi3wlneuw5ppamyxhzzd7dwxcj7iy/ERC5719/0x11b858b3b52eb84e900639ebb082aeacb10bd9d239f58ae3f7092885cc3593b6'
    );
  }
}

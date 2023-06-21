// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/modules/commons/ModuleIPFS.sol";

import "foundry_test/base/AdvTest.sol";

contract ModuleIPFSTest is AdvTest {
  ModuleIPFS private module;

  function setUp() public {
    module = new ModuleIPFS();
  }

  function test_exposeRoot() external {
    // 0xba5a3cbb592813d90eae65a3aac33e9b6dfc7be50623aa25e151fe3da06c8443
    // ==
    // ipfs://bafybeif2li6lwwjicpmq5ltfuovmgpu3nx6hxzigeovclykr7y62a3eeim

    // 0xb6f77d000c8791676d96aedac165dd1bb2da4a5baf78198b9f391fc76b893f46
    // ==
    // ipfs://bafybeifw656qadehsftw3fvo3lawlxi3wlneuw5ppamyxhzzd7dwxcj7iy

    vm.startPrank(address(module));

    bytes32 root = 0xba5a3cbb592813d90eae65a3aac33e9b6dfc7be50623aa25e151fe3da06c8443;
    module.updateIPFSRoot(root);

    assertEq(module.ipfsRootBytes32(), root);
    assertEq(
      module.ipfsRoot(),
      'ipfs://bafybeif2li6lwwjicpmq5ltfuovmgpu3nx6hxzigeovclykr7y62a3eeim'
    );

    root = 0xb6f77d000c8791676d96aedac165dd1bb2da4a5baf78198b9f391fc76b893f46;
    module.updateIPFSRoot(root);

    assertEq(module.ipfsRootBytes32(), root);
    assertEq(
      module.ipfsRoot(),
      'ipfs://bafybeifw656qadehsftw3fvo3lawlxi3wlneuw5ppamyxhzzd7dwxcj7iy'
    );
  }

  function test_fail_updateIPFSRoot_notSelf(address _notSelf) external {
    boundDiff(_notSelf, address(module));

    vm.prank(address(_notSelf));
    vm.expectRevert(abi.encodeWithSignature('OnlySelfAuth(address,address)', _notSelf, address(module)));
    module.updateIPFSRoot(0x0);
  }
}

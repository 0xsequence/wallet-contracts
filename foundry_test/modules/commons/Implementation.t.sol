// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "contracts/modules/commons/Implementation.sol";
import "contracts/Factory.sol";

import "foundry_test/base/AdvTest.sol";


contract ImplementationImp is Implementation {
  function setImplementation(address _imp) external {
    _setImplementation(_imp);
  }

  function getImplementation() external view returns (address) {
    return _getImplementation();
  }

  function stub() external virtual pure returns (uint256) {
    return 1;
  }
}

contract NextImplementation is ImplementationImp {
  function stub() external override pure returns (uint256) {
    return 2;
  }
}

contract ImplementationTest is AdvTest {
  function test_setImplementation(address _imp, address _next) external {
    _imp = boundNoSys(_imp);

    vm.etch(_imp, address(new ImplementationImp()).code);

    assertEq(ImplementationImp(_imp).getImplementation(), address(0));

    ImplementationImp(_imp).setImplementation(_next);

    assertEq(ImplementationImp(_imp).getImplementation(), _next);
    assertEq(vm.load(_imp, addrToBytes32(_imp)), addrToBytes32(_next));
  }

  function test_setImplementation_matchWallet(bytes32 _salt, address _imp, address _imp2) external {
    Factory factory = new Factory();

    _imp = boundNoSys(_imp);

    vm.etch(_imp, address(new ImplementationImp()).code);
    address wallet = factory.deploy(_imp, _salt);

    assertEq(ImplementationImp(wallet).getImplementation(), _imp);
    assertEq(ImplementationImp(wallet).stub(), 1);

    vm.etch(_imp2, address(new NextImplementation()).code);

    ImplementationImp(wallet).setImplementation(_imp2);

    assertEq(ImplementationImp(wallet).getImplementation(), _imp2);
    assertEq(vm.load(wallet, addrToBytes32(wallet)), addrToBytes32(_imp2));
    assertEq(ImplementationImp(wallet).stub(), 2);
  }
}

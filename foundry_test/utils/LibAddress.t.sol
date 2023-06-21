// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/utils/LibAddress.sol";

import "foundry_test/base/AdvTest.sol";


contract LibAddressTest is AdvTest {
  function test_isContract(address _addr, bytes calldata _code) external {
    boundNoSys(_addr);

    vm.etch(_addr, _code);
    assertEq(LibAddress.isContract(_addr), _code.length > 0);
  }
}

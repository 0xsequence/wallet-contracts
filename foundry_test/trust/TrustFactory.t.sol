// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/trust/TrustFactory.sol";

import "foundry_test/base/AdvTest.sol";

contract TrustFactoryTest is AdvTest {
  TrustFactory private factory;

  function setUp() external {
    factory = new TrustFactory();
  }

  function test_create_trust(address _owner, address _beneficiary, uint256 _duration) external {
    Trust trust = factory.deploy(_owner, _beneficiary, _duration);
    address trustAddress = address(trust);

    assertEq(trust.owner(), _owner);
    assertEq(trust.beneficiary(), _beneficiary);
    assertEq(trust.duration(), _duration);

    uint256 codeSize; assembly { codeSize := extcodesize(trustAddress) }
    assertGt(codeSize, 0);
  }

  function test_predict_address(address _owner, address _beneficiary, uint256 _duration) external {
    address expected = factory.addressOf(_owner, _beneficiary, _duration);
    address actual = address(factory.deploy(_owner, _beneficiary, _duration));
    assertEq(actual, expected);
  }

  function test_fail_deploy_twice(address _owner, address _beneficiary, uint256 _duration) external {
    factory.deploy(_owner, _beneficiary, _duration);
    vm.expectRevert();
    factory.deploy(_owner, _beneficiary, _duration);
  }

  function test_fail_deploy_low_gas(address _owner, address _beneficiary, uint256 _duration, uint256 _gas) external {
    _gas = bound(_gas, 21000, block.gaslimit);
    try factory.deploy{ gas: _gas }(_owner, _beneficiary, _duration) returns (Trust trust) {
      address trustAddress = address(trust);
      // The address should have code, and never be the zero address
      assertNotEq(trustAddress, address(0));
      uint256 codeSize; assembly { codeSize := extcodesize(trustAddress) }
      assertGt(codeSize, 0);
    } catch {
      // Ignore errors from low gas
    }
  }
}

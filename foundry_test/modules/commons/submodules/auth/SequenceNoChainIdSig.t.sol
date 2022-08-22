// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.16;

import "contracts/modules/commons/submodules/auth/SequenceNoChainIdSig.sol";

import "foundry_test/base/AdvTest.sol";


contract SequenceNoChainIdSigImp {
  function subDigest(bytes32 _digest) external view returns (bytes32) {
    return SequenceNoChainIdSig.subDigest(_digest);
  }
}

contract SequenceNoChainIdSigTest is AdvTest {
  SequenceNoChainIdSigImp private lib;

  function setUp() public {
    lib = new SequenceNoChainIdSigImp();
  }

  function test_subDigest_DiffDigest(bytes32 _digest1, bytes32 _digest2) external {
    bytes32 res1 = lib.subDigest(_digest1);
    bytes32 res2 = lib.subDigest(_digest2);
    assertTrue(res1 != res2 || _digest1 == _digest2);
  }

  function test_subDigest_DiffAddress(bytes32 _digest, address _addr1, address _addr2) external {
    _addr1 = boundNoSys(_addr1);
    _addr2 = boundNoSys(_addr2);

    vm.etch(_addr1, address(lib).code);
    vm.etch(_addr2, address(lib).code);

    bytes32 res1 = SequenceNoChainIdSigImp(_addr1).subDigest(_digest);
    bytes32 res2 = SequenceNoChainIdSigImp(_addr2).subDigest(_digest);

    assertTrue(res1 != res2 || _addr1 == _addr2);
  }

  function test_subDigest_DiffChainId(bytes32 _digest, uint256 _chainId1, uint256 _chainId2) external {
    vm.chainId(_chainId1);
    bytes32 res1 = lib.subDigest(_digest);
    vm.chainId(_chainId2);
    bytes32 res2 = lib.subDigest(_digest);

    assertTrue(res1 == res2);
  }
}

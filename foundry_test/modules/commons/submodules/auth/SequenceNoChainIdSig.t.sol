// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/modules/commons/submodules/auth/SequenceNoChainIdSig.sol";

import "foundry_test/base/AdvTest.sol";


contract SequenceNoChainIdSigImp {
  function subdigest(bytes32 _digest) external view returns (bytes32) {
    return SequenceNoChainIdSig.subdigest(_digest);
  }
}

contract SequenceNoChainIdSigTest is AdvTest {
  SequenceNoChainIdSigImp private lib;

  function setUp() public {
    lib = new SequenceNoChainIdSigImp();
  }

  function test_subdigest_DiffDigest(bytes32 _digest1, bytes32 _digest2) external {
    bytes32 res1 = lib.subdigest(_digest1);
    bytes32 res2 = lib.subdigest(_digest2);
    assertTrue(res1 != res2 || _digest1 == _digest2);
  }

  function test_subdigest_DiffAddress(bytes32 _digest, address _addr1, address _addr2) external {
    boundNoContract(boundNoSys(_addr1));
    boundNoContract(boundNoSys(_addr2));

    vm.etch(_addr1, address(lib).code);
    vm.etch(_addr2, address(lib).code);

    bytes32 res1 = SequenceNoChainIdSigImp(_addr1).subdigest(_digest);
    bytes32 res2 = SequenceNoChainIdSigImp(_addr2).subdigest(_digest);

    assertTrue(res1 != res2 || _addr1 == _addr2);
  }

  function test_subdigest_DiffChainId(bytes32 _digest, uint256 _chainId1, uint256 _chainId2) external {
    _chainId1 = bound(_chainId1, 0, type(uint64).max);
    _chainId2 = bound(_chainId2, 0, type(uint64).max);

    vm.chainId(_chainId1);
    bytes32 res1 = lib.subdigest(_digest);
    vm.chainId(_chainId2);
    bytes32 res2 = lib.subdigest(_digest);

    assertTrue(res1 == res2);
  }
}

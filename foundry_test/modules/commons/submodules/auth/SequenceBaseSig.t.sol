// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "contracts/modules/commons/submodules/auth/SequenceBaseSig.sol";

import "foundry_test/base/AdvTest.sol";


contract SequenceBaseSigImp {
  function subDigest(bytes32 _digest) external view returns (bytes32) {
    return SequenceBaseSig.subDigest(_digest);
  }

  function joinAddrAndWeight(address _addr, uint96 _weight) external pure returns (bytes32) {
    return SequenceBaseSig._joinAddrAndWeight(_addr, _weight);
  }

  function recoverBranch(bytes32 _digest, bytes calldata _signature) external view returns (uint256 weight, bytes32 root) {
    return SequenceBaseSig.recoverBranch(_digest, _signature);
  }

  function recover(bytes32 _subDigest, bytes calldata _signature) external view returns (uint256 threshold, uint256 weight, bytes32 imageHash) {
    return SequenceBaseSig.recover(_subDigest, _signature);
  }
}

contract SequenceBaseSigTest is AdvTest {
  SequenceBaseSigImp private lib;

  uint8 private constant FLAG_SIGNATURE = 0;
  uint8 private constant FLAG_ADDRESS = 1;
  uint8 private constant FLAG_DYNAMIC_SIGNATURE = 2;
  uint8 private constant FLAG_NODE = 3;
  uint8 private constant FLAG_BRANCH = 4;

  function setUp() public {
    lib = new SequenceBaseSigImp();
  }

  function test_subDigest(bytes32 _digest, uint256 _chainId) external {
    bytes32 expected = keccak256(
      abi.encodePacked(
        "\x19\x01",
        _chainId,
        address(lib),
        _digest
      )
    );

    vm.chainId(_chainId);
    bytes32 actual = lib.subDigest(_digest);
    assertEq(actual, expected);
  }

  function test_subDigest_Fuzz_ChainId(bytes32 _digest, uint256 _chainId1, uint256 _chainId2) external {
    vm.chainId(_chainId1);
    bytes32 subDigest1 = lib.subDigest(_digest);

    vm.chainId(_chainId2);
    bytes32 subDigest2 = lib.subDigest(_digest);

    assertTrue(subDigest1 != subDigest2 || _chainId1 == _chainId2);
  }

  function test_subDigest_Fuzz_Digest(bytes32 _digest1, bytes32 _digest2) external {
    bytes32 subDigest1 = lib.subDigest(_digest1);
    bytes32 subDigest2 = lib.subDigest(_digest2);

    assertTrue(subDigest1 != subDigest2 || _digest1 == _digest2);
  }

  function test_subDigest_Fuzz_Address(bytes32 _digest, address _addr1, address _addr2) external {
    _addr1 = boundNoSys(_addr1);
    _addr2 = boundNoSys(_addr2);

    vm.etch(_addr1, address(lib).code);
    vm.etch(_addr2, address(lib).code);

    bytes32 subDigest1 = SequenceBaseSigImp(_addr1).subDigest(_digest);
    bytes32 subDigest2 = SequenceBaseSigImp(_addr2).subDigest(_digest);

    assertTrue(subDigest1 != subDigest2 || _addr1 == _addr2);
  }

  function test_joinAddrAndWeight(address _addr, uint96 _weight) external {
    bytes32 expected = abi.decode(abi.encodePacked(_weight, _addr), (bytes32));
    bytes32 actual = lib.joinAddrAndWeight(_addr, _weight);
    assertEq(expected, actual);
  }

  function test_recoverBranch_Addresses(bytes32 _subdigest, bytes32 _seed, address[] calldata _addresses) external {
    bytes memory signature;
    bytes32 root;

    uint256 size = mayBoundArr(_addresses.length);
    for (uint256 i = 0; i < size; i++) {
      uint8 randomWeight = uint8(bound(uint256(keccak256(abi.encode(_addresses[i], i, _seed))), 0, type(uint8).max));

      signature = abi.encodePacked(signature, FLAG_ADDRESS, randomWeight, _addresses[i]);
      bytes32 node = lib.joinAddrAndWeight(_addresses[i], randomWeight);
      root = root != bytes32(0) ? keccak256(abi.encodePacked(root, node)) : node;
    }

    (uint256 recoveredWeight, bytes32 recoveredRoot) = lib.recoverBranch(_subdigest, signature);
    assertEq(recoveredRoot, root);
    assertEq(recoveredWeight, 0);
  }

  function test_recoverBranch_Nodes(bytes32 _subdigest, bytes32[] calldata _nodes) external {
    bytes memory signature;
    bytes32 root;

    uint256 size = mayBoundArr(_nodes.length);
    for (uint256 i = 0; i < size; i++) {
      signature = abi.encodePacked(signature, FLAG_NODE, _nodes[i]);
      root = root != bytes32(0) ? keccak256(abi.encodePacked(root, _nodes[i])) : _nodes[i];
    }

    (uint256 recoveredWeight, bytes32 recoveredRoot) = lib.recoverBranch(_subdigest, signature);
    assertEq(recoveredRoot, root);
    assertEq(recoveredWeight, 0);
  }

  function test_recoverBranch_Signatures(bytes32 _subdigest, bytes32 _seed, uint256[] memory _pks) external {
    bytes memory signature;
    bytes32 root;
    uint256 total;

    uint256 size = mayBoundArr(_pks.length);
    for (uint256 i = 0; i < size; i++) {
      _pks[i] = boundPk(_pks[i]);

      uint8 randomWeight = uint8(bound(uint256(keccak256(abi.encode(_pks[i], i, _seed))), 0, type(uint8).max));
      address addr = vm.addr(_pks[i]);

      // Determine if the pk will sign, dynamic sign or just sit as addr
      uint256 op = bound(uint256(keccak256(abi.encode(_pks[i], i, _seed, 2))), 0, 2);

      if (op == 0) {
        signature = abi.encodePacked(signature, FLAG_ADDRESS, randomWeight, addr);
      } else {
        bytes memory sigpart = signAndPack(_pks[i], _subdigest, 1);

        total += randomWeight;

        if (op == 1) {
          signature = abi.encodePacked(signature, FLAG_SIGNATURE, randomWeight, sigpart);
        } else {
          signature = abi.encodePacked(signature, FLAG_DYNAMIC_SIGNATURE, randomWeight, addr, uint16(sigpart.length), sigpart);
        }
      }

      bytes32 node = lib.joinAddrAndWeight(addr, randomWeight);
      root = root != bytes32(0) ? keccak256(abi.encodePacked(root, node)) : node;
    }

    (uint256 recoveredWeight, bytes32 recoveredRoot) = lib.recoverBranch(_subdigest, signature);
    assertEq(recoveredRoot, root);
    assertEq(recoveredWeight, total);
  }

  function test_recoverBranch_Branches(bytes32 _subdigest, bytes32 _seed, uint256[] memory _pks) external {
    bytes memory signature;
    bytes32 root;
    uint256 total;

    // NOTICE: too much branching will lead to stack overflow
    uint256 size = bound(_pks.length, 0, 32);

    for (uint256 i = 0; i < size; i++) {
      if (i != 0) {
        signature = abi.encodePacked(FLAG_BRANCH, uint16(signature.length), signature);
      }

      _pks[i] = boundPk(_pks[i]);

      uint8 randomWeight = uint8(bound(uint256(keccak256(abi.encode(_pks[i], i, _seed))), 0, type(uint8).max));
      address addr = vm.addr(_pks[i]);

      // Determine if the pk will sign, dynamic sign or just sit as addr
      uint256 op = bound(uint256(keccak256(abi.encode(_pks[i], i, _seed, 2))), 0, 2);

      if (op == 0) {
        signature = abi.encodePacked(FLAG_ADDRESS, randomWeight, addr, signature);
      } else {
        bytes memory sigpart = signAndPack(_pks[i], _subdigest, 1);

        total += randomWeight;

        if (op == 1) {
          signature = abi.encodePacked(FLAG_SIGNATURE, randomWeight, sigpart, signature);
        } else {
          signature = abi.encodePacked(FLAG_DYNAMIC_SIGNATURE, randomWeight, addr, uint16(sigpart.length), sigpart, signature);
        }
      }

      bytes32 node = lib.joinAddrAndWeight(addr, randomWeight);
      // Hash in reverse order requires branching, root/node -> node/root
      root = root != bytes32(0) ? keccak256(abi.encodePacked(node, root)) : node;
    }

    (uint256 recoveredWeight, bytes32 recoveredRoot) = lib.recoverBranch(_subdigest, signature);
    assertEq(recoveredRoot, root);
    assertEq(recoveredWeight, total);
  }

  function test_recoverBranch_Empty(bytes32 _hash) external {
    (uint256 weight1, bytes32 root1) = lib.recoverBranch(_hash, abi.encodePacked(FLAG_NODE, bytes32(0)));
    (uint256 weight2, bytes32 root2) = lib.recoverBranch(_hash, bytes(''));

    assertEq(weight2, 0);
    assertEq(root2, bytes32(0));
    assertEq(weight1, weight2);
    assertEq(root1, root2);
  }

  function test_recoverBranch_Fail_InvalidFlag(uint8 _flag, bytes23 _hash, bytes calldata _sufix) external {
    _flag = uint8(boundDiff(_flag, FLAG_SIGNATURE, FLAG_ADDRESS, FLAG_DYNAMIC_SIGNATURE, FLAG_NODE, FLAG_BRANCH));

    vm.expectRevert(abi.encodeWithSignature('InvalidSignatureFlag(uint256)', _flag));
    lib.recoverBranch(_hash, abi.encodePacked(_flag, _sufix));
  }

  function test_recover(bytes32 _subdigest, uint256 _pk, uint16 _threshold, uint8 _weight) external {
    _pk = boundPk(_pk);

    bytes memory signature = signAndPack(_pk, _subdigest, 1);
    address addr = vm.addr(_pk);

    bytes32 expectImageHash = abi.decode(abi.encodePacked(uint96(_weight), addr), (bytes32));
    expectImageHash = keccak256(abi.encodePacked(expectImageHash, bytes32(uint256(_threshold))));

    bytes memory encoded = abi.encodePacked(_threshold, FLAG_SIGNATURE, _weight, signature);
    (uint256 threshold, uint256 weight, bytes32 imageHash) = lib.recover(_subdigest, encoded);

    assertEq(weight, _weight);
    assertEq(threshold, _threshold);
    assertEq(imageHash, expectImageHash);
  }

  function test_recover_Fail_EmptySignature(bytes32 _subdigest) external {
    vm.expectRevert();
    lib.recover(_subdigest, bytes(''));
  }
}

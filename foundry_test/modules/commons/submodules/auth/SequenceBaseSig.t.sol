// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/modules/commons/submodules/auth/SequenceBaseSig.sol";

import "foundry_test/base/AdvTest.sol";


contract SequenceBaseSigImp {
  function subdigest(bytes32 _digest) external view returns (bytes32) {
    return SequenceBaseSig.subdigest(_digest);
  }

  function leafForAddressAndWeight(address _addr, uint96 _weight) external pure returns (bytes32) {
    return SequenceBaseSig._leafForAddressAndWeight(_addr, _weight);
  }

  function recoverBranch(bytes32 _digest, bytes calldata _signature) external view returns (uint256 weight, bytes32 root) {
    return SequenceBaseSig.recoverBranch(_digest, _signature);
  }

  function recover(bytes32 _subdigest, bytes calldata _signature) external view returns (uint256 threshold, uint256 weight, bytes32 imageHash, uint256 checkpoint) {
    return SequenceBaseSig.recover(_subdigest, _signature);
  }
}

contract SequenceBaseSigTest is AdvTest {
  SequenceBaseSigImp private lib;

  uint8 private constant FLAG_SIGNATURE = 0;
  uint8 private constant FLAG_ADDRESS = 1;
  uint8 private constant FLAG_DYNAMIC_SIGNATURE = 2;
  uint8 private constant FLAG_NODE = 3;
  uint8 private constant FLAG_BRANCH = 4;
  uint8 private constant FLAG_SUBDIGEST = 5;
  uint8 private constant FLAG_NESTED = 6;

  function setUp() public {
    lib = new SequenceBaseSigImp();
  }

  function test_subdigest(bytes32 _digest, uint256 _chainId) external {
    _chainId = bound(_chainId, 0, type(uint64).max);

    bytes32 expected = keccak256(
      abi.encodePacked(
        "\x19\x01",
        _chainId,
        address(lib),
        _digest
      )
    );

    vm.chainId(_chainId);
    bytes32 actual = lib.subdigest(_digest);
    assertEq(actual, expected);
  }

  function test_subdigest_Fuzz_ChainId(bytes32 _digest, uint256 _chainId1, uint256 _chainId2) external {
    _chainId1 = bound(_chainId1, 0, type(uint64).max);
    _chainId2 = bound(_chainId2, 0, type(uint64).max);

    vm.chainId(_chainId1);
    bytes32 subdigest1 = lib.subdigest(_digest);

    vm.chainId(_chainId2);
    bytes32 subdigest2 = lib.subdigest(_digest);

    assertTrue(subdigest1 != subdigest2 || _chainId1 == _chainId2);
  }

  function test_subdigest_Fuzz_Digest(bytes32 _digest1, bytes32 _digest2) external {
    bytes32 subdigest1 = lib.subdigest(_digest1);
    bytes32 subdigest2 = lib.subdigest(_digest2);

    assertTrue(subdigest1 != subdigest2 || _digest1 == _digest2);
  }

  function test_subdigest_Fuzz_Address(bytes32 _digest, address _addr1, address _addr2) external {
    boundNoSys(_addr1);
    boundNoSys(_addr2);

    vm.etch(_addr1, address(lib).code);
    vm.etch(_addr2, address(lib).code);

    bytes32 subdigest1 = SequenceBaseSigImp(_addr1).subdigest(_digest);
    bytes32 subdigest2 = SequenceBaseSigImp(_addr2).subdigest(_digest);

    assertTrue(subdigest1 != subdigest2 || _addr1 == _addr2);
  }

  function test_leafForAddressAndWeight(address _addr, uint96 _weight) external {
    bytes32 expected = abi.decode(abi.encodePacked(_weight, _addr), (bytes32));
    bytes32 actual = lib.leafForAddressAndWeight(_addr, _weight);
    assertEq(expected, actual);
  }

  function test_leafForAddressAndWeight_fuzz(address _addr1, uint96 _weight1, address _addr2, uint96 _weight2) external {
    bytes32 encoded1 = lib.leafForAddressAndWeight(_addr1, _weight1);
    bytes32 encoded2 = lib.leafForAddressAndWeight(_addr2, _weight2);
    assertEq(encoded1 == encoded2, _addr1 == _addr2 && _weight1 == _weight2);
  }

  function test_leafForHardcodedSubdigest_fuzz(bytes32 _subdigest1, bytes32 _subdigest2) external {
    bytes32 encoded1 = SequenceBaseSig._leafForHardcodedSubdigest(_subdigest1);
    bytes32 encoded2 = SequenceBaseSig._leafForHardcodedSubdigest(_subdigest2);
    assertEq(encoded1 == encoded2, _subdigest1 == _subdigest2);
  }

  function test_leafForHardcodedSubdigest_fuzz_addr(address _addr, uint96 _weight, bytes32 _subdigest) external {
    bytes32 encoded1 = SequenceBaseSig._leafForHardcodedSubdigest(_subdigest);
    bytes32 encoded2 = SequenceBaseSig._leafForAddressAndWeight(_addr, _weight);
    assertTrue(encoded1 != encoded2);
  }

  function test_leafForNested_fuzz(
    bytes32 _node1,
    uint256 _threshold1,
    uint256 _weight1,
    bytes32 _node2,
    uint256 _threshold2,
    uint256 _weight2
  ) external {
    bytes32 encoded1 = SequenceBaseSig._leafForNested(_node1, _threshold1, _weight1);
    bytes32 encoded2 = SequenceBaseSig._leafForNested(_node2, _threshold2, _weight2);
    assertEq(encoded1 == encoded2, _node1 == _node2 && _threshold1 == _threshold2 && _weight1 == _weight2);
  }

  function test_leafForNested_fuzz_addr(
    address _addr,
    uint96 _weight,
    bytes32 _node,
    uint256 _threshold,
    uint256 _nodeWeight
  ) external {
    bytes32 encoded1 = SequenceBaseSig._leafForNested(_node, _threshold, _nodeWeight);
    bytes32 encoded2 = SequenceBaseSig._leafForAddressAndWeight(_addr, _weight);
    assertTrue(encoded1 != encoded2);
  }

  function test_leafForNested_fuzz_subdigest(
    bytes32 _subdigest,
    bytes32 _node,
    uint256 _threshold,
    uint256 _weight
  ) external {
    bytes32 encoded1 = SequenceBaseSig._leafForNested(_node, _threshold, _weight);
    bytes32 encoded2 = SequenceBaseSig._leafForHardcodedSubdigest(_subdigest);
    assertTrue(encoded1 != encoded2);
  }

  function test_recoverBranch_Addresses(bytes32 _subdigest, bytes32 _seed, address[] calldata _addresses) external {
    bytes memory signature;
    bytes32 root;

    uint256 size = mayBoundArr(_addresses.length);
    for (uint256 i = 0; i < size; i++) {
      uint8 randomWeight = uint8(bound(uint256(keccak256(abi.encode(_addresses[i], i, _seed))), 0, type(uint8).max));

      signature = abi.encodePacked(signature, FLAG_ADDRESS, randomWeight, _addresses[i]);
      bytes32 node = lib.leafForAddressAndWeight(_addresses[i], randomWeight);
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
          signature = abi.encodePacked(signature, FLAG_DYNAMIC_SIGNATURE, randomWeight, addr, uint24(sigpart.length), sigpart);
        }
      }

      bytes32 node = lib.leafForAddressAndWeight(addr, randomWeight);
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
        signature = abi.encodePacked(FLAG_BRANCH, uint24(signature.length), signature);
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
          signature = abi.encodePacked(FLAG_DYNAMIC_SIGNATURE, randomWeight, addr, uint24(sigpart.length), sigpart, signature);
        }
      }

      bytes32 node = lib.leafForAddressAndWeight(addr, randomWeight);
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
    uint8(boundDiff(_flag, FLAG_SIGNATURE, FLAG_ADDRESS, FLAG_DYNAMIC_SIGNATURE, FLAG_NODE, FLAG_BRANCH, FLAG_SUBDIGEST, FLAG_NESTED));

    vm.expectRevert(abi.encodeWithSignature('InvalidSignatureFlag(uint256)', _flag));
    lib.recoverBranch(_hash, abi.encodePacked(_flag, _sufix));
  }

  function test_recover(bytes32 _subdigest, uint256 _pk, uint32 _checkpoint, uint16 _threshold, uint8 _weight) external {
    _pk = boundPk(_pk);

    bytes memory signature = signAndPack(_pk, _subdigest, 1);
    address addr = vm.addr(_pk);

    bytes32 expectImageHash = abi.decode(abi.encodePacked(uint96(_weight), addr), (bytes32));
    expectImageHash = keccak256(abi.encodePacked(expectImageHash, uint256(_threshold)));
    expectImageHash = keccak256(abi.encodePacked(expectImageHash, uint256(_checkpoint)));

    bytes memory encoded = abi.encodePacked(_threshold, _checkpoint, FLAG_SIGNATURE, _weight, signature);
    (uint256 threshold, uint256 weight, bytes32 imageHash, uint256 checkpoint) = lib.recover(_subdigest, encoded);

    assertEq(weight, _weight);
    assertEq(threshold, _threshold);
    assertEq(imageHash, expectImageHash);
    assertEq(checkpoint, _checkpoint);
  }

  function test_recover_Fail_EmptySignature(bytes32 _subdigest) external {
    vm.expectRevert();
    lib.recover(_subdigest, bytes(''));
  }
}

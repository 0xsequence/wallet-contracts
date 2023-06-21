// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/modules/commons/ModuleStorage.sol";

import "foundry_test/base/AdvTest.sol";


contract ModuleStorageImp {
  function writeBytes32(bytes32 _key, bytes32 _val) external {
    ModuleStorage.writeBytes32(_key, _val);
  }

  function readBytes32(bytes32 _key) external view returns (bytes32) {
    return ModuleStorage.readBytes32(_key);
  }

  function writeBytes32Map(bytes32 _key, bytes32 _subKey, bytes32 _val) external {
    ModuleStorage.writeBytes32Map(_key, _subKey, _val);
  }

  function readBytes32Map(bytes32 _key, bytes32 _subKey) external view returns (bytes32) {
    return ModuleStorage.readBytes32Map(_key, _subKey);
  }
}


contract ModuleStorageTest is AdvTest {
  ModuleStorageImp private imp;

  function setUp() external {
    imp = new ModuleStorageImp();
  }

  function test_writeBytes32(
    bytes32 _key1,
    bytes32 _key2,
    bytes32 _val1,
    bytes32 _val2
  ) external {
    assertEq(imp.readBytes32(_key1), bytes32(0));
    assertEq(imp.readBytes32(_key2), bytes32(0));

    bool equal = _key1 == _key2;

    imp.writeBytes32(_key1, _val1);

    bytes32 res1 = imp.readBytes32(_key1);
    assertEq(res1, _val1);
    assertEq(vm.load(address(imp), _key1), res1);

    imp.writeBytes32(_key2, _val2);

    bytes32 res2 = imp.readBytes32(_key2);
    res1 = imp.readBytes32(_key1);

    assertEq(res1, equal ? _val2 : _val1);
    assertEq(res2, _val2);
    assertEq(vm.load(address(imp), _key1), res1);
    assertEq(vm.load(address(imp), _key2), res2);
  }

  function test_writeBytes32Map(
    bytes32 _key1,
    bytes32 _subkey1,
    bytes32 _val1,
    bytes32 _key2,
    bytes32 _subkey2,
    bytes32 _val2
  ) external {
    bool equal = _key1 == _key2 && _subkey1 == _subkey2;
    bytes32 slot1 = keccak256(abi.encode(_key1, _subkey1));
    bytes32 slot2 = keccak256(abi.encode(_key2, _subkey2));
    assertEq(slot1 == slot2, equal);

    imp.writeBytes32Map(_key1, _subkey1, _val1);
    bytes32 res1 = imp.readBytes32Map(_key1, _subkey1);
    assertEq(res1, _val1);
    assertEq(vm.load(address(imp), slot1), res1);

    imp.writeBytes32Map(_key2, _subkey2, _val2);

    bytes32 res2 = imp.readBytes32Map(_key2, _subkey2);
    res1 = imp.readBytes32Map(_key1, _subkey1);

    assertEq(res1, equal ? _val2 : _val1);
    assertEq(res2, _val2);
    assertEq(vm.load(address(imp), slot1), res1);
    assertEq(vm.load(address(imp), slot2), res2);
  }
}

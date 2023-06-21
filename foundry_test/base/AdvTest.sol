// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "forge-std/Test.sol";


contract AdvTest is Test {
  function signAndPack(uint256 _pk, bytes32 _hash) internal pure returns (bytes memory) {
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(_pk, _hash);
    return abi.encodePacked(r, s, v);
  }

  function signAndPack(uint256 _pk, bytes32 _hash, uint8 _sufix) internal pure returns (bytes memory) {
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(_pk, _hash);
    return abi.encodePacked(r, s, v, _sufix);
  }

  function mayBoundArr(uint256 _size) internal view returns (uint256) {
    try vm.envUint('MAX_ARRAY_LEN') returns (uint256 b) {
      return b == 0 ? _size : bound(_size, 0, b);
    } catch {
      return _size;
    }
  }

  function boundNoSys(address _a) internal view returns (address) {
    address c2 = address(0x007109709ecfa91a80626ff3989d68f67f5b1dd12d);
    address vm = address(0x004e59b44847b379578588920ca78fbf26c0b4956c);
    address c3 = address(0x00000000000000000000636f6e736f6c652e6c6f67);

    boundNoPrecompile(_a);
    boundDiff(_a, c2, vm, c3, address(this));

    return _a;
  }

  function boundNoPrecompile(address _a) internal pure returns (address) {
    vm.assume(uint160(_a)> 10);
    return _a;
  }

  function boundDiff(address _a, address _b) internal pure returns (address) {
    vm.assume(_a != _b);
    return _a;
  }

  function boundDiff(address _a, address _b, address _c) internal pure returns (address) {
    address[] memory arr = new address[](2);
    arr[0] = _b;
    arr[1] = _c;
    return boundDiff(_a, arr);
  }

  function boundDiff(address _a, address _b, address _c, address _d) internal pure returns (address) {
    address[] memory _arr = new address[](3);
    _arr[0] = _b;
    _arr[1] = _c;
    _arr[2] = _d;
    return boundDiff(_a, _arr);
  }

  function boundDiff(address _a, address _b, address _c, address _d, address _e) internal pure returns (address) {
    address[] memory _arr = new address[](4);
    _arr[0] = _b;
    _arr[1] = _c;
    _arr[2] = _d;
    _arr[3] = _e;
    return boundDiff(_a, _arr);
  }

  function boundDiff(address _a, address[] memory _b) internal pure returns (address) {
    vm.assume(!inSet(_a, _b));
    return _a;
  }

  function boundPk(uint256 _a) internal view returns (uint256) {
    _a = bound(_a, 1, 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364139);
    return _a;
  }

  function boundDiff(uint256 _a, uint256 _b) internal pure returns (uint256) {
    vm.assume(_a != _b);
    return _a;
  }

  function boundDiff(uint256 _a, uint256 _b, uint256 _c) internal pure returns (uint256) {
    uint256[] memory arr = new uint256[](2);
    arr[0] = _b;
    arr[1] = _c;
    return boundDiff(_a, arr);
  }

  function boundDiff(uint256 _a, uint256 _b, uint256 _c, uint256 _d) internal pure returns (uint256) {
    uint256[] memory _arr = new uint256[](3);
    _arr[0] = _b;
    _arr[1] = _c;
    _arr[2] = _d;
    return boundDiff(_a, _arr);
  }

  function boundDiff(uint256 _a, uint256 _b, uint256 _c, uint256 _d, uint256 _e) internal pure returns (uint256) {
    uint256[] memory _arr = new uint256[](4);
    _arr[0] = _b;
    _arr[1] = _c;
    _arr[2] = _d;
    _arr[3] = _e;
    return boundDiff(_a, _arr);
  }

  function boundDiff(uint256 _a, uint256 _b, uint256 _c, uint256 _d, uint256 _e, uint256 _f) internal pure returns (uint256) {
    uint256[] memory _arr = new uint256[](5);
    _arr[0] = _b;
    _arr[1] = _c;
    _arr[2] = _d;
    _arr[3] = _e;
    _arr[4] = _f;
    return boundDiff(_a, _arr);
  }

  function boundDiff(uint256 _a, uint256 _b, uint256 _c, uint256 _d, uint256 _e, uint256 _f, uint256 _g) internal pure returns (uint256) {
    uint256[] memory _arr = new uint256[](6);
    _arr[0] = _b;
    _arr[1] = _c;
    _arr[2] = _d;
    _arr[3] = _e;
    _arr[4] = _f;
    _arr[5] = _g;
    return boundDiff(_a, _arr);
  }

  function boundDiff(uint256 _a, uint256 _b, uint256 _c, uint256 _d, uint256 _e, uint256 _f, uint256 _g, uint256 _h) internal pure returns (uint256) {
    uint256[] memory _arr = new uint256[](7);
    _arr[0] = _b;
    _arr[1] = _c;
    _arr[2] = _d;
    _arr[3] = _e;
    _arr[4] = _f;
    _arr[5] = _g;
    _arr[6] = _h;
    return boundDiff(_a, _arr);
  }

  function boundDiff(uint256 _a, uint256[] memory _b) internal pure returns (uint256) {
    vm.assume(!inSet(_a, _b));
    return _a;
  }

  function inSet(uint256 _a, uint256[] memory _b) internal pure returns (bool) {
    unchecked {
      for (uint256 i = 0; i < _b.length; i++) {
        if (_a == _b[i]) {
          return true;
        }
      }

      return false;
    }
  }

  function inSet(address _a, address[] memory _b) internal pure returns (bool) {
    unchecked {
      for (uint256 i = 0; i < _b.length; i++) {
        if (_a == _b[i]) {
          return true;
        }
      }

      return false;
    }
  }

  function boundNoContract(address _a) internal view returns (address) {
    vm.assume(_a.code.length == 0);
    return _a;
  }

  function boundNoBalance(address _a) internal view returns (address) {
    vm.assume(_a.balance == 0);
    return _a;
  }

  function replicate(bytes memory _data) internal {
    (bool suc, bytes memory res) = address(this).call(_data);
    if (!suc) {
      assembly {
        revert(add(res, 32), mload(res))
      }
    }
  }

  function addrToBytes32(address _addr) internal pure returns (bytes32) {
    return bytes32(uint256(uint160(_addr)));
  }
}

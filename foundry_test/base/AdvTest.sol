// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "forge-std/Test.sol";


contract AdvTest is Test {
  function boundNoSys(address _a) internal view returns (address) {
    address c2 = address(0x007109709ecfa91a80626ff3989d68f67f5b1dd12d);
    address vm = address(0x004e59b44847b379578588920ca78fbf26c0b4956c);
    address c3 = address(0x00000000000000000000636f6e736f6c652e6c6f67);

    _a = boundNoPrecompile(_a);

    _a = boundDiff(_a, c2);
    _a = boundDiff(_a, vm);
    _a = boundDiff(_a, c3);
    _a = boundDiff(_a, address(this));

    return _a;
  }

  function boundNoPrecompile(address _a) internal pure returns (address) {
    if (uint160(_a) > 0 && uint160(_a) < 10) {
      return address(10);
    }

    return _a;
  }

  function boundDiff(address _a, address _b) internal pure returns (address) {
    if (_a != _b) return _a;

    return address(uint160(_b) == type(uint160).max ? 0 : uint160(_b) + 1);
  }

  function boundPk(uint256 _a) internal pure returns (uint256) {
    if (_a > 0 && _a <= 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140) {
      return _a;
    }

    uint256 mod = _a % 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140;
    return 1 + mod;
  }

  function boundDiff(uint256 _a, uint256 _b) internal pure returns (uint256) {
    if (_a != _b) return _a;

    unchecked {
      return _a + 1;
    }
  }

  function boundDiff(uint256 _a, uint256 _b, uint256 _c) internal pure returns (uint256) {
    if (_a != _b && _a != _c) return _a;

    unchecked {
      uint256 res = _a + 1;

      if (res == _b || res == _c) {
        res++;
      }

      return res;
    }
  }

  function boundDiff(uint256 _a, uint256 _b, uint256 _c, uint256 _d) internal pure returns (uint256) {
    if (_a != _b && _a != _c && _a != _d) return _a;

    unchecked {
      uint256 res = _a + 1;

      if (res == _b || res == _c || res == _d) {
        res++;
      } else {
        return res;
      }

      if (res == _b || res == _c || res == _d) {
        res++;
      }

      return res;
    }
  }
}

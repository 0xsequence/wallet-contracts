// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/utils/LibOptim.sol";

import "foundry_test/base/AdvTest.sol";

contract WillReturn {
  bytes private r;

  constructor (bytes memory _r) {
    r = _r;
  }

  fallback() external {
    bytes memory res = r;
    assembly {
      return(add(res, 32), mload(res))
    }
  }
}

contract LibOptimTest is AdvTest {
  function test_fkeccak256_Bytes32_Bytes32_Fuzz(bytes32 _a, bytes32 _b) external {
    bytes32 expected = keccak256(abi.encodePacked(_a, _b));
    bytes32 actual = LibOptim.fkeccak256(_a, _b);
    assertEq(expected, actual);
  }

  function test_returnData_Fuzz(bytes memory _data) external {
    WillReturn r = new WillReturn(_data);

    (bool suc, bytes memory res1) = address(r).call(bytes(''));
    assertEq(suc, true);
    assertEq(res1, _data);

    uint256 pointer1; assembly { pointer1 := mload(0x40) }
    assertTrue(pointer1 != 0);

    bytes memory optres = LibOptim.returnData();
    assertEq(res1, optres);

    uint256 pointer2; assembly { pointer2 := mload(0x40) }
    assertEq(pointer2 - pointer1, res1.length + 32);

    uint256 positionArr; assembly { positionArr := optres }
    assertEq(positionArr, pointer1);
  }

  function test_call(
    address _to,
    uint256 _val,
    bytes calldata _data
  ) external {
    _to = boundNoSys(_to);
    _to = boundDiff(_to, address(0x004e59b44847b379578588920ca78fbf26c0b4956c));

    vm.expectCall(_to, _data);
    vm.deal(_to, 0);
    vm.deal(address(this), _val);
    LibOptim.call(_to, _val, gasleft(), _data);
    assertEq(_to.balance, _val);
  }
}

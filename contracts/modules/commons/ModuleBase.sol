pragma solidity ^0.6.7;
pragma experimental ABIEncoderV2;


contract ModuleBase {
  modifier onlySelf() {
    require(msg.sender == address(this), "ModuleBase#onlySelf: NOT_AUTHORIZED");
    _;
  }

  function _writeBytes32(bytes32 _key, bytes32 _val) internal {
    assembly {
      sstore(_key, _val)
    }
  }

  function _readBytes32(bytes32 _key) internal view returns (bytes32 val) {
    assembly {
      val := sload(_key)
    }
  }
}

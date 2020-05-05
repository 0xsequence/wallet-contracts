pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;


library ModuleStorage {
  function writeBytes32(bytes32 _key, bytes32 _val) internal {
    assembly {
      sstore(_key, _val)
    }
  }

  function readBytes32(bytes32 _key) internal view returns (bytes32 val) {
    assembly {
      val := sload(_key)
    }
  }
}

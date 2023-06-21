// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

/**
 * @title Library for optimized EVM operations
 * @author Agustin Aguilar (aa@horizon.io)
 * @notice This library contains functions for optimizing certain EVM operations.
 */
library LibOptim {

  /**
   * @notice Computes the keccak256 hash of two 32-byte inputs.
   * @dev It uses only scratch memory space.
   * @param _a The first 32 bytes of the hash.
   * @param _b The second 32 bytes of the hash.
   * @return c The keccak256 hash of the two 32-byte inputs.
   */
  function fkeccak256(
    bytes32 _a,
    bytes32 _b
  ) internal pure returns (bytes32 c) {
    assembly {
      mstore(0, _a)
      mstore(32, _b)
      c := keccak256(0, 64)
    }
  }

  /**
   * @notice Returns the return data from the last call.
   * @return r The return data from the last call.
   */
  function returnData() internal pure returns (bytes memory r) {
    assembly {
      let size := returndatasize()
      r := mload(0x40)
      let start := add(r, 32)
      mstore(0x40, add(start, size))
      mstore(r, size)
      returndatacopy(start, 0, size)
    }
  }

  /**
   * @notice Calls another contract with the given parameters.
   * @dev This method doesn't increase the memory pointer.
   * @param _to The address of the contract to call.
   * @param _val The value to send to the contract.
   * @param _gas The amount of gas to provide for the call.
   * @param _data The data to send to the contract.
   * @return r The success status of the call.
   */
  function call(
    address _to,
    uint256 _val,
    uint256 _gas,
    bytes calldata _data
  ) internal returns (bool r) {
    assembly {
      let tmp := mload(0x40)
      calldatacopy(tmp, _data.offset, _data.length)

      r := call(
        _gas,
        _to,
        _val,
        tmp,
        _data.length,
        0,
        0
      )
    }
  }

  /**
   * @notice Calls another contract with the given parameters, using delegatecall.
   * @dev This method doesn't increase the memory pointer.
   * @param _to The address of the contract to call.
   * @param _gas The amount of gas to provide for the call.
   * @param _data The data to send to the contract.
   * @return r The success status of the call.
   */
  function delegatecall(
    address _to,
    uint256 _gas,
    bytes calldata _data
  ) internal returns (bool r) {
    assembly {
      let tmp := mload(0x40)
      calldatacopy(tmp, _data.offset, _data.length)

      r := delegatecall(
        _gas,
        _to,
        tmp,
        _data.length,
        0,
        0
      )
    }
  }
}

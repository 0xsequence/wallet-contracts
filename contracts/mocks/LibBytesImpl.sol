pragma solidity ^0.6.4;

import "../utils/LibBytes.sol";


contract LibBytesImpl {
  using LibBytes for bytes;

  function popLastByte(bytes memory _data) public pure returns (bytes memory, bytes1) {
    bytes1 by = _data.popLastByte();
    return (_data, by);
  }

  function readUint8Uint16(bytes calldata _data, uint256 _index) external pure returns (uint8, uint16, uint256) {
    return _data.readUint8Uint16(_index);
  }

  function readBoolUint8(bytes calldata _data, uint256 _index) external pure returns (bool, uint8, uint256) {
    return _data.readBoolUint8(_index);
  }

  function readAddress(bytes calldata _data, uint256 _index) external pure returns (address, uint256) {
    return _data.readAddress(_index);
  }

  function readBytes66(bytes calldata _data, uint256 _index) external pure returns (bytes memory, uint256) {
    return _data.readBytes66(_index);
  }

  function readBytes32(bytes calldata _data, uint256 _index) external pure returns (bytes32) {
    return _data.readBytes32(_index);
  }

  function writeUint16(bytes memory _dest, uint256 _index, uint16 _a) public pure returns (bytes memory, uint256) {
    uint256 newIndex = _dest.writeUint16(_index, _a);
    return (_dest, newIndex);
  }

  function writeUint8Address(
    bytes memory _dest,
    uint256 _index,
    uint8 _a,
    address _b
  ) public pure returns (bytes memory, uint256) {
    uint256 newIndex = _dest.writeUint8Address(_index, _a, _b);
    return (_dest, newIndex);
  }
}

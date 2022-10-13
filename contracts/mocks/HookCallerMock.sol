// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;

import "../interfaces/receivers/IERC1155Receiver.sol";
import "../interfaces/receivers/IERC721Receiver.sol";
import "../interfaces/receivers/IERC223Receiver.sol";

import "../interfaces/IERC1271Wallet.sol";


contract HookCallerMock {
  function callERC1155Received(address _addr) external {
    bytes4 result = IERC1155Receiver(_addr).onERC1155Received(
      address(this),
      msg.sender,
      1,
      2,
      msg.data
    );

    require(result == 0xf23a6e61, "HookCallerMock#callERC1155Received: INVALID_RETURN");
  }

  function callERC1155BatchReceived(address _addr) external {
    uint256[] memory ids = new uint256[](3);
    ids[0] = 1;
    ids[1] = 2;
    ids[2] = 3;

    uint256[] memory values = new uint256[](3);
    values[0] = 200;
    values[1] = 300;
    values[2] = 400;

    bytes4 result = IERC1155Receiver(_addr).onERC1155BatchReceived(
      address(this),
      msg.sender,
      ids,
      values,
      msg.data
    );

    require(result == 0xbc197c81, "HookCallerMock#callERC1155BatchReceived: INVALID_RETURN");
  }

  function callERC721Received(address _addr) external {
    bytes4 result = IERC721Receiver(_addr).onERC721Received(
      address(this),
      msg.sender,
      1,
      msg.data
    );

    require(result == 0x150b7a02, "HookCallerMock#callERC721Received: INVALID_RETURN");
  }

  function callERC223Received(address _addr) external {
    IERC223Receiver(_addr).tokenFallback(msg.sender, 1, msg.data);
  }

  function callERC1271isValidSignatureData(
    address _addr,
    bytes calldata _data,
    bytes calldata _signature
  ) external view {
    bytes4 result = IERC1271Wallet(_addr).isValidSignature(_data, _signature);
    require(result == 0x20c13b0b, "HookCallerMock#callERC1271isValidSignatureData: INVALID_RETURN");
  }

  function callERC1271isValidSignatureHash(
    address _addr,
    bytes32 _hash,
    bytes calldata _signature
  ) external view {
    bytes4 result = IERC1271Wallet(_addr).isValidSignature(_hash, _signature);
    require(result == 0x1626ba7e, "HookCallerMock#callERC1271isValidSignatureHash: INVALID_RETURN");
  }
}

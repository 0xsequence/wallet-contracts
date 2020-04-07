pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "./ModuleBase.sol";

import "../../interfaces/receivers/IERC1155Receiver.sol";
import "../../interfaces/receivers/IERC721Receiver.sol";


contract ModuleHooks is ModuleBase, IERC1155Receiver, IERC721Receiver {
  mapping(bytes4 => address) public hooks;

  /**
   * @notice Adds a new hook to handle a given function selector
   * @param _signature Signature function linked to the hook
   * @param _implementation Hook implementation contract
   */
  function addHook(bytes4 _signature, address _implementation) external onlySelf {
    require(hooks[_signature] == address(0), "ModuleHooks#addHook: HOOK_ALREADY_REGISTERED");
    hooks[_signature] = _implementation;
  }

  /**
   * @notice Removes a registered hook
   * @param _signature Signature function linked to the hook
   */
  function removeHook(bytes4 _signature) external onlySelf {
    require(hooks[_signature] != address(0), "ModuleHooks#removeHook: HOOK_NOT_REGISTERED");
    delete hooks[_signature];
  }

  /**
   * @notice Handle the receipt of a single ERC1155 token type.
   * @return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
   */
  function onERC1155Received(
    address,
    address,
    uint256,
    uint256,
    bytes calldata
  ) external override returns (bytes4) {
    return ModuleHooks.onERC1155Received.selector;
  }

  /**
   * @notice Handle the receipt of multiple ERC1155 token types.
   * @return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
   */
  function onERC1155BatchReceived(
    address,
    address,
    uint256[] calldata,
    uint256[] calldata,
    bytes calldata
  ) external override returns (bytes4) {
    return ModuleHooks.onERC1155BatchReceived.selector;
  }

  /**
   * @notice Handle the receipt of a single ERC721 token.
   * @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
   */
  function onERC721Received(address, address, uint256, bytes calldata) external override returns (bytes4) {
    return ModuleHooks.onERC721Received.selector;
  }

  /* solhint-disable */

  /**
   * @notice Routes fallback calls through hooks
   */
  fallback() external payable {
    address target = hooks[msg.sig];
    if (target != address(0)) {
      (bool success, bytes memory result) = target.delegatecall(msg.data);
      assembly {
        if iszero(success)  {
          revert(add(result, 0x20), mload(result))
        }

        return(add(result, 0x20), mload(result))
      }
    }
  }

  /**
   * @notice Allows the wallet to receive ETH
   */
  receive() external payable { }

  /* solhint-disable */
}

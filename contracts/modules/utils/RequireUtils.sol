// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "../commons/ModuleNonce.sol";
import "../commons/submodules/nonce/SubModuleNonce.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract RequireUtils {
  /**
   * @notice Validates that a given expiration hasn't expired
   * @dev Used as an optional transaction on a Sequence batch, to create expirable transactions.
   *
   * @param _expiration  Expiration to check
   */
  function requireNonExpired(uint256 _expiration) external view {
    require(block.timestamp < _expiration, "RequireUtils#requireNonExpired: EXPIRED");
  }

  /**
   * @notice Validates that a given wallet has reached a given nonce
   * @dev Used as an optional transaction on a Sequence batch, to define transaction execution order
   *
   * @param _wallet Sequence wallet
   * @param _nonce  Required nonce
   */
  function requireMinNonce(address _wallet, uint256 _nonce) external view {
    (uint256 space, uint256 nonce) = SubModuleNonce.decodeNonce(_nonce);
    uint256 currentNonce = ModuleNonce(_wallet).readNonce(space);
    require(currentNonce >= nonce, "RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED");
  }

  /**
   * @notice Validates that a wallet has a minimum ERC20 token balance
   * @param _token ERC20 token address
   * @param _wallet Sequence wallet
   * @param _minBalance Minimum required balance
   */
  function requireMinERC20Balance(address _token, address _wallet, uint256 _minBalance) external view {
    uint256 balance = IERC20(_token).balanceOf(_wallet);
    require(balance >= _minBalance, 'RequireUtils#requireMinERC20Balance: BALANCE_TOO_LOW');
  }

  /**
   * @notice Validates that a wallet has a minimum ERC20 allowance for a spender
   * @param _token ERC20 token address
   * @param _owner Sequence wallet
   * @param _spender Address allowed to spend the tokens
   * @param _minAllowance Minimum required allowance
   */
  function requireMinERC20Allowance(address _token, address _owner, address _spender, uint256 _minAllowance) external view {
    uint256 allowance = IERC20(_token).allowance(_owner, _spender);
    require(allowance >= _minAllowance, 'RequireUtils#requireMinERC20Allowance: ALLOWANCE_TOO_LOW');
  }

  /**
   * @notice Validates that a wallet owns a specific ERC721 token
   * @param _token ERC721 token address
   * @param _wallet Sequence wallet
   * @param _tokenId Token ID to check for ownership
   */
  function requireERC721Ownership(address _token, address _wallet, uint256 _tokenId) external view {
    address owner = IERC721(_token).ownerOf(_tokenId);
    require(owner == _wallet, 'RequireUtils#requireERC721Ownership: NOT_OWNER');
  }

  /**
   * @notice Validates that an ERC721 token is approved for a specific spender
   * @param _token ERC721 token address
   * @param _owner Sequence wallet
   * @param _spender Address that should have approval
   * @param _tokenId Token ID to check for approval
   */
  function requireERC721Approval(address _token, address _owner, address _spender, uint256 _tokenId) external view {
    address approved = IERC721(_token).getApproved(_tokenId);
    require(
      approved == _spender || IERC721(_token).isApprovedForAll(_owner, _spender),
      'RequireUtils#requireERC721Approval: NOT_APPROVED'
    );
  }

  /**
   * @notice Validates that a wallet has a minimum balance of an ERC1155 token
   * @param _token ERC1155 token address
   * @param _wallet Sequence wallet
   * @param _tokenId Token ID to check
   * @param _minBalance Minimum required balance
   */
  function requireMinERC1155Balance(address _token, address _wallet, uint256 _tokenId, uint256 _minBalance) external view {
    uint256 balance = IERC1155(_token).balanceOf(_wallet, _tokenId);
    require(balance >= _minBalance, 'RequireUtils#requireMinERC1155Balance: BALANCE_TOO_LOW');
  }

  /**
   * @notice Validates that an ERC1155 token is approved for a specific operator
   * @param _token ERC1155 token address
   * @param _owner Sequence wallet
   * @param _operator Address that should have operator approval
   */
  function requireERC1155Approval(address _token, address _owner, address _operator) external view {
    bool isApproved = IERC1155(_token).isApprovedForAll(_owner, _operator);
    require(isApproved, 'RequireUtils#requireERC1155Approval: NOT_APPROVED');
  }
}

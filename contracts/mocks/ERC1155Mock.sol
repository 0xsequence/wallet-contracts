// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract ERC1155Mock {
  string public name = 'Mock ERC1155 Token';
  string public symbol = 'MERC1155';
  address public owner;

  mapping(uint256 => mapping(address => uint256)) public balances;
  mapping(address => mapping(address => bool)) public operatorApprovals;

  constructor() {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, 'Only owner can mint');
    _;
  }

  function balanceOf(address account, uint256 id) public view returns (uint256) {
    return balances[id][account];
  }

  function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory) {
    require(accounts.length == ids.length, 'Accounts and ids length mismatch');

    uint256[] memory batchBalances = new uint256[](accounts.length);
    for (uint256 i = 0; i < accounts.length; ++i) {
      batchBalances[i] = balances[ids[i]][accounts[i]];
    }
    return batchBalances;
  }

  function mint(address to, uint256 id, uint256 amount) public onlyOwner {
    require(to != address(0), 'Cannot mint to zero address');

    balances[id][to] += amount;
    emit TransferSingle(msg.sender, address(0), to, id, amount);
  }

  function safeTransferFrom(address from, address to, uint256 id, uint256 amount) public {
    require(from == msg.sender || isApprovedForAll(from, msg.sender), 'Not approved to transfer');

    require(balances[id][from] >= amount, 'Insufficient balance');
    balances[id][from] -= amount;
    balances[id][to] += amount;

    emit TransferSingle(msg.sender, from, to, id, amount);
  }

  function setApprovalForAll(address operator, bool approved) public {
    operatorApprovals[msg.sender][operator] = approved;
    emit ApprovalForAll(msg.sender, operator, approved);
  }

  function isApprovedForAll(address account, address operator) public view returns (bool) {
    return operatorApprovals[account][operator];
  }

  event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
  event ApprovalForAll(address indexed account, address indexed operator, bool approved);
}

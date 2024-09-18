// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract ERC1155Mock {
  string public name = 'Mock ERC1155 Token';
  string public symbol = 'MERC1155';
  address public owner;

  // Mappings para gestionar los balances y las aprobaciones
  mapping(uint256 => mapping(address => uint256)) public balances;
  mapping(address => mapping(address => bool)) public operatorApprovals;

  constructor() {
    owner = msg.sender;
  }

  // Modificador para funciones restringidas al propietario del contrato
  modifier onlyOwner() {
    require(msg.sender == owner, 'Only owner can mint');
    _;
  }

  // Consulta el balance de un determinado `account` para un token específico `id`
  function balanceOf(address account, uint256 id) public view returns (uint256) {
    return balances[id][account];
  }

  // Consulta el balance de múltiples direcciones para múltiples tokens
  function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory) {
    require(accounts.length == ids.length, 'Accounts and ids length mismatch');

    uint256[] memory batchBalances = new uint256[](accounts.length);
    for (uint256 i = 0; i < accounts.length; ++i) {
      batchBalances[i] = balances[ids[i]][accounts[i]];
    }
    return batchBalances;
  }

  // Función para acuñar (mint) tokens, solo accesible por el propietario
  function mint(address to, uint256 id, uint256 amount) public onlyOwner {
    require(to != address(0), 'Cannot mint to zero address');

    balances[id][to] += amount;
    emit TransferSingle(msg.sender, address(0), to, id, amount);
  }

  // Permite a un operador transferir tokens desde una cuenta a otra
  function safeTransferFrom(address from, address to, uint256 id, uint256 amount) public {
    require(from == msg.sender || isApprovedForAll(from, msg.sender), 'Not approved to transfer');

    require(balances[id][from] >= amount, 'Insufficient balance');
    balances[id][from] -= amount;
    balances[id][to] += amount;

    emit TransferSingle(msg.sender, from, to, id, amount);
  }

  // Permite aprobar o remover a un operador para manejar todos los tokens del llamador
  function setApprovalForAll(address operator, bool approved) public {
    operatorApprovals[msg.sender][operator] = approved;
    emit ApprovalForAll(msg.sender, operator, approved);
  }

  // Devuelve si un operador está aprobado para manejar todos los tokens de un propietario
  function isApprovedForAll(address account, address operator) public view returns (bool) {
    return operatorApprovals[account][operator];
  }

  // Eventos obligatorios para cumplir con el estándar ERC-1155
  event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
  event ApprovalForAll(address indexed account, address indexed operator, bool approved);
}

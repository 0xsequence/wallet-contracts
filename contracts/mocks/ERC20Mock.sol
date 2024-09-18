// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract ERC20Mock {
  string public name = 'Mock ERC20 Token';
  string public symbol = 'MERC20';
  uint8 public decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) public balances;
  mapping(address => mapping(address => uint256)) public allowances;

  constructor(uint256 initialSupply) {
    totalSupply = initialSupply;
    balances[msg.sender] = initialSupply;
  }

  // Consulta el balance de un determinado `account`
  function balanceOf(address account) public view returns (uint256) {
    return balances[account];
  }

  // Transfiere tokens al destinatario `recipient`
  function transfer(address recipient, uint256 amount) public returns (bool) {
    require(balances[msg.sender] >= amount, 'Insufficient balance');
    balances[msg.sender] -= amount;
    balances[recipient] += amount;
    emit Transfer(msg.sender, recipient, amount);
    return true;
  }

  // Devuelve la cantidad que un `spender` puede gastar en nombre de `owner`
  function allowance(address owner, address spender) public view returns (uint256) {
    return allowances[owner][spender];
  }

  // Permite a un `spender` gastar hasta `amount` tokens en nombre del llamador
  function approve(address spender, uint256 amount) public returns (bool) {
    allowances[msg.sender][spender] = amount;
    emit Approval(msg.sender, spender, amount);
    return true;
  }

  // Permite a un `spender` transferir tokens desde una cuenta a otra
  function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
    require(balances[sender] >= amount, 'Insufficient balance');
    require(allowances[sender][msg.sender] >= amount, 'Allowance exceeded');
    balances[sender] -= amount;
    balances[recipient] += amount;
    allowances[sender][msg.sender] -= amount;
    emit Transfer(sender, recipient, amount);
    return true;
  }

  // Eventos obligatorios para cumplir con el estándar ERC-20
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

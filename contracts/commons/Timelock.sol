// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.16;

import "./Ownable.sol";


contract Timelock is Ownable {
  event UpdatedDelays(
    uint256 _minDelay,
    uint256 _maxDelay
  );

  event QueuedTransaction(
    bytes32 indexed _hash,
    address indexed _target,
    uint256 _value,
    bytes _data,
    uint256 _salt,
    uint256 _eta
  );

  event CancelledTransaction(
    bytes32 indexed _hash
  );

  error NotSelf(address _caller);
  error TimestampPassed(uint256 _timestamp);
  error BelowMinDelay(uint256 _delay, uint256 _minDelay);
  error AboveMaxDelay(uint256 _delay, uint256 _maxDelay);
  error TransactionNotScheduled(bytes32 _hash);
  error TransactionNotReady(bytes32 _hash, uint256 _eta);
  error TransactionReverted(bytes32 _hash, bytes _result);
  error TransactionPastExecutionWindow(bytes32 _hash, uint256 _endWindow);

  mapping(bytes32 => uint256) public commits;
  uint256 public minDelay = 30 days;
  uint256 public maxDelay = 365 days;

  struct Transaction {
    address to;
    uint256 value;
    bytes data;
    uint256 salt;
  }

  constructor(address _owner) Ownable(_owner) {}

  function hashTransaction(
    Transaction calldata _tx
  ) public pure returns (bytes32) {
    return keccak256(abi.encode(_tx));
  }

  function setDelays(uint256 _minDelay, uint256 _maxDelay) external {
    if (msg.sender != address(this)) revert NotSelf(msg.sender);

    minDelay = _minDelay;
    maxDelay = _maxDelay;

    emit UpdatedDelays(_minDelay, _maxDelay);
  }

  function schedule(
    Transaction calldata _tx,
    uint256 _timestamp
  ) external onlyOwner {
    if (_timestamp < block.timestamp) revert TimestampPassed(_timestamp);

    uint256 delta = _timestamp - block.timestamp;
    if (delta < minDelay) revert BelowMinDelay(delta, minDelay);
    if (delta > maxDelay) revert AboveMaxDelay(delta, maxDelay);

    bytes32 txHash = hashTransaction(_tx);
    commits[txHash] = _timestamp;

    emit QueuedTransaction(
      txHash,
      _tx.to,
      _tx.value,
      _tx.data,
      _tx.salt,
      _timestamp
    );
  }

  function cancel(
    bytes32 _txHash
  ) external onlyOwner {
    commits[_txHash] = 0;

    emit CancelledTransaction(_txHash);
  }

  function execute(
    Transaction calldata _tx
  ) external onlyOwner {
    bytes32 txHash = hashTransaction(_tx);
    uint256 eta = commits[txHash];

    if (eta == 0) revert TransactionNotScheduled(txHash);
    if (eta > block.timestamp) revert TransactionNotReady(txHash, eta);

    uint256 endWindow = eta + maxDelay;
    if (endWindow < block.timestamp) revert TransactionPastExecutionWindow(txHash, endWindow);
 
    commits[txHash] = 0;

    (bool success, bytes memory result) = _tx.to.call{value: _tx.value}(_tx.data);
    if (!success) revert TransactionReverted(txHash, result);
  }
}

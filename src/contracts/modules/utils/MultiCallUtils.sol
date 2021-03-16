// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "../commons/interfaces/IModuleCalls.sol";


contract MultiCallUtils {
  function multiCall(
    IModuleCalls.Transaction[] memory _txs
  ) public payable returns (
    bool[] memory _successes,
    bytes[] memory _results
  ) {
    _successes = new bool[](_txs.length);
    _results = new bytes[](_txs.length);

    for (uint256 i = 0; i < _txs.length; i++) {
      IModuleCalls.Transaction memory transaction = _txs[i];

      require(!transaction.delegateCall, 'MultiCallUtils#multiCall: delegateCall not allowed');
      require(gasleft() >= transaction.gasLimit, "MultiCallUtils#multiCall: NOT_ENOUGH_GAS");

      // solhint-disable
      (_successes[i], _results[i]) = transaction.target.call{
        value: transaction.value,
        gas: transaction.gasLimit == 0 ? gasleft() : transaction.gasLimit
      }(transaction.data);
      // solhint-enable

      require(_successes[i] || !_txs[i].revertOnError, 'MultiCallUtils#multiCall: CALL_REVERTED');
    }
  }

  // ///
  // Globals
  // ///

  function callBlockhash(uint256 _i) external view returns (bytes32) {
    return blockhash(_i);
  }

  function callCoinbase() external view returns (address) {
    return block.coinbase;
  }

  function callDifficulty() external view returns (uint256) {
    return block.difficulty;
  }

  function callGasLimit() external view returns (uint256) {
    return block.gaslimit;
  }

  function callBlockNumber() external view returns (uint256) {
    return block.gaslimit;
  }

  function callTimestamp() external view returns (uint256) {
    return block.timestamp;
  }

  function callGasLeft() external view returns (uint256) {
    return gasleft();
  }

  function callGasPrice() external view returns (uint256) {
    return tx.gasprice;
  }

  function callOrigin() external view returns (address) {
    return tx.origin;
  }

  function callBalanceOf(address _addr) external view returns (uint256) {
    return _addr.balance;
  }

  function callCodeSize(address _addr) external view returns (uint256 size) {
    assembly { size := extcodesize(_addr) }
  }

  function callCode(address _addr) external view returns (bytes memory code) {
    assembly {
      let size := extcodesize(_addr)
      code := mload(0x40)
      mstore(0x40, add(code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
      mstore(code, size)
      extcodecopy(_addr, add(code, 0x20), 0, size)
    }
  }

  function callCodeHash(address _addr) external view returns (bytes32 codeHash) {
    assembly { codeHash := extcodehash(_addr) }
  }

  function callChainId() external pure returns (uint256 id) {
    assembly { id := chainid() }
  }
}

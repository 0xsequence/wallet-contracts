// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;


contract DelegateCallMock {
  event Readed(uint256 _val);

  uint256 private constant REVERT_SLOT = uint256(keccak256("revert-flag"));

  mapping(uint256 => uint256) private store;

  function setRevertFlag(bool _revertFlag) external {
    store[REVERT_SLOT] = _revertFlag ? 1 : 0;
  }

  function write(uint256 _key, uint256 _val) external {
    require(store[REVERT_SLOT] == 0, "DelegateCallMock#write: REVERT_FLAG");
    store[_key] = _val;
  }

  function read(uint256 _key) external {
    emit Readed(store[_key]);
  }
}

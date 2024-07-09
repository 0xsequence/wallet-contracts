// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "./utils/LibClone.sol";


contract EternalFactory {
  function deployEternal(address _mainModule, bytes32 _salt) public payable returns (address _contract) {
    return LibClone.cloneDeterministic(_mainModule, _salt);
  }
}

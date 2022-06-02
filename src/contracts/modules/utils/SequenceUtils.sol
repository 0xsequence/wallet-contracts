// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;
pragma experimental ABIEncoderV2;

import "./MultiCallUtils.sol";
import "./RequireUtils.sol";


contract SequenceUtils is 
  MultiCallUtils,
  RequireUtils
{
  constructor(
    address _factory,
    address _mainModule
  ) RequireUtils(
    _factory,
    _mainModule
  ) {}
}

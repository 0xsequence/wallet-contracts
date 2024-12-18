// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import {IWalletProxy} from './interfaces/IWalletProxy.sol';
import {Implementation} from '../modules/commons/Implementation.sol';

contract WalletProxyHook is IWalletProxy, Implementation {
  /// @inheritdoc IWalletProxy
  function PROXY_getImplementation() public view returns (address) {
    return _getImplementation();
  }
}

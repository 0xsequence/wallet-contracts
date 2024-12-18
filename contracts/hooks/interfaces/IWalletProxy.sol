// Copyright Immutable Pty Ltd 2018 - 2023
// SPDX-License-Identifier: Apache 2.0
// https://github.com/immutable/contracts/blob/a04f7ecb8a79ad8f1b67f73f770e0545deb6cba2/contracts/allowlist/IWalletProxy.sol
pragma solidity 0.8.18;

// Interface to retrieve the implemention stored inside the Proxy contract
/// Interface for Passport Wallet's proxy contract.
interface IWalletProxy {
    // Returns the current implementation address used by the proxy contract
    // solhint-disable-next-line func-name-mixedcase
    function PROXY_getImplementation() external view returns (address);
}

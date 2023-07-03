# Sequence Smart Wallet Contracts

Ethereum contracts for the Sequence Smart Wallet at [https://sequence.app](https://sequence.app).

For more information, visit [https://sequence.build](https://sequence.build)

## Usage

Please visit [https://sequence.app](https://sequence.app) to access the Sequence Wallet via your Web Browser, or
download "Sequence Wallet" from the respective Apple/Google stores.

You may also access, interface, or develop your own Sequence Wallet via [sequence.js](https://github.com/0xsequence/sequence.js). The
sequence.js library offers a full open source library to interact, create, deploy and manage a Sequence Smart Wallet Account,
as defined by the contracts in this repository. Also see [go-sequence](https://github.com/0xsequence/go-sequence) for an implementation
in Go.

## Connecting your Dapp with Sequence Wallet

If you wish to use Sequence Wallet in your Dapp, simply use [sequence.js](https://github.com/0xsequence/sequence.js). Sequence.js
is an Ethereum client library built on [ethers.js](https://github.com/ethers-io/ethers.js), that provides an additional
Sequence Smart Wallet Signer.

Please refer to the [sequence.js](https://github.com/0xsequence/sequence.js) repository for usage instructions.

# Developing a Custom Wallet UI for Sequence (Advanced!)

If you wish to use the Sequence Wallet Contracts `@0xsequence/wallet-contracts` directly:

1. Install the contracts: `yarn add @0xsequence/wallet-contracts` or `npm install @0xsequence/wallet-contracts`
2. Install the Sequence Wallet libraries: `yarn add @0xsequence/wallet` or `npm install @0xsequence/wallet`. You can view the source,
   of the [wallet libraries](https://github.com/0xsequence/sequence.js/tree/master/packages/wallet), and review the
   [Sequence tests](https://github.com/0xsequence/sequence.js/tree/master/packages/0xsequence) for sample usage.

**NOTE:** this integration is only needed if you want low-level access to the Sequence Wallet contracts, such as if you'd building
your own custom wallet, or perhaps a CLI tool for managing your wallet.

## Security Review

`@0xsequence/wallet-contracts` has been audited by independent parties.

### V2 Audits

- [Consensys Diligence](https://github.com/0xsequence/wallet-contracts/blob/master/audits/v2/consensys-horizon-sequence-wallet-audit-2023-02.pdf) - February 2023
- [Zellic](https://github.com/0xsequence/wallet-contracts/raw/master/audits/Quantstamp_Arcadeum_Report_Final.pdf) - March 2023

### V1 Audits

- [Consensys Diligence](https://github.com/0xsequence/wallet-contracts/blob/master/audits/v1/Consensys_Diligence.md) - May 2020
- [Quantstamp - initial audit](https://github.com/0xsequence/wallet-contracts/raw/master/audits/v1/Quantstamp_Arcadeum_Report_Final.pdf) - July 2020
- [Quantstamp - audit of new capability, nested Sequence signers](https://github.com/0xsequence/wallet-contracts/raw/master/audits/v1/sequence_quantstamp_audit_feb_2021.pdf) - February 2021

## License

Copyright (c) 2017-present [Horizon Blockchain Games Inc](https://horizon.io).

Licensed under [Apache-2.0](https://github.com/0xsequence/erc-1155/blob/master/LICENSE)

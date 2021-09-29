Sequence Smart Wallet Contracts
===============================

Ethereum contracts for the Sequence Smart Wallet at [https://sequence.app](https://sequence.app).

For more information see, [https://sequence.build](https://sequence.build)


## Usage

Please visit [https://sequence.app](https://sequence.app) to access the Sequence Wallet via your Web Browser, or
download "Sequence Wallet" from the respective Apple/Google stores.

You may also access, interface or develop your own Sequence Wallet via [sequence.js](https://github.com/0xsequence/sequence.js). The
sequence.js library offers a full open source library to interact, create, deploy and manage a Sequence Smart Wallet Account,
as defined by the contracts in this respository. Also see [go-sequence](https://github.com/0xsequence/go-sequence) for an implementation
in Go.


## Connecting your Dapp with Sequence Wallet

If you wish to use Sequence Wallet in your Dapp, simply use [sequence.js](https://github.com/0xsequence/sequence.js). Sequence.js
is an Ethereum client library built on [ethers.js](https://github.com/ethers-io/ethers.js), that provides an additional
Sequence Smart Wallet Signer.

1. Install Sequence.js, an Ethereum client library built on ethers.js -- `yarn add 0xsequence` or `npm install 0xsequence`

2. Setup an Ethereum web3-compatible provider from your dapp to the Sequence Wallet

```typescript
import { sequence } from '0xsequence'

const wallet = new sequence.Wallet('mainnet')
await wallet.login()

const provider = wallet.getProvider()
// .. connect provider to your dapp
```

# Developing a custom Wallet UI for Sequence (advanced!)

If you wish to the Sequence Wallet Contracts `@0xsequence/wallet-contracts` directly:

1. Install the contracts -- `yarn add @0xsequence/wallet-contracts` or `npm install @0xsequence/wallet-contracts`
2. Install the Sequence Wallet libraries -- `yarn add @0xsequence/wallet` or `npm install @0xsequence/wallet`. To view the source,
   of the wallet libraries, [see here](https://github.com/0xsequence/sequence.js/tree/master/packages/wallet), and review the test
   for sample usage, as well as the tests [here]((https://github.com/0xsequence/sequence.js/tree/master/packages/0xsequence)).

NOTE: this integration is only needed if you want low-level access to the Sequence Wallet contracts, such as if you'd building
your own custom wallet, or perhaps a CLI tool for managing your wallet.


## Security Review

`@0xsequence/wallet-contracts` has been audited by two independant parties

* [Consensys Diligence](https://github.com/0xsequence/wallet-contracts/blob/master/audits/Consensys_Diligence.md) - May 2020
* [Quantstamp - initial audit](https://github.com/0xsequence/wallet-contracts/raw/master/audits/Quantstamp_Arcadeum_Report_Final.pdf) - July 2020
* [Quantstamp - audit of new capability, nested Sequence signers](https://github.com/0xsequence/wallet-contracts/raw/master/audits/sequence_quantstamp_audit_feb_2021.pdf) - Feb 2021


## Dev env & release

This repository is configured as a yarn workspace, and has multiple pacakge.json files. Specifically,
we have the root ./package.json for the development environment, contract compilation and testing. Contract
source code and distribution files are packaged in "src/package.json".

To release a new version, make sure to bump the version, tag it, and run `yarn release`. The `release` command
will publish the `@0xsequence/wallet-contracts` package in the "src/" folder, separate from the root package. The advantage
here is that application developers who consume `@0xsequence/wallet-contracts` aren't required to install any of the devDependencies
in their toolchains as our build and contract packages are separated.


## LICENSE

Copyright (c) 2017-present [Horizon Blockchain Games Inc](https://horizon.io).

Licensed under [Apache-2.0](https://github.com/0xsequence/erc-1155/blob/master/LICENSE)

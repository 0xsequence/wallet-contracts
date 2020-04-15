# Arcadeum Wallet <a name="introduction"></a>

TODO

# Table of contents

1. [Wallet creation](#wallet-creation)
    1. [Weigthed signatures](#weigthed-signatures)
    2. [Signers image](#signers-image)
    3. [Wallet deployment](#deployment)
2. [Signing messages](#signing)

# Wallet creation <a name="wallet-creation"></a>

## Weigthed signatures <a name="wallet-creation"></a>

All Arcadeum wallets are owned by a collection of signers with weights and a threshold, also known as a weighted multi-signature wallet. This design allows any combination of signers up to a maximum of 256 addresses.

The wallet accepts signed meta-transactions, the signatures are valid as long as the combined weight of the signers is above the specified threshold.

### Single owner wallet

Wallets with a single owner can be created by specifying a threshold of 1, and a single signer with a weight of 1.

## Signers image <a name="signers-image"></a>

The signature requirements and uniqueness of each wallet are determined by a `signers image` bytes array; this intermediary variable is composed by the wallets threshold and each owner's address with his weight.

The `signers image` is hashed, and the resulting `hashed image` is used as the salt during the contract creation, subsequent signatures are validated by reconstructing this `hashed image`.

> :warning: The same combination of threshold, signers and, weights is sequence-dependent and can result in different wallet addresses when the signers are provided in different orders.

### Encoding

The `signers image` is encoded as a Solidity packed bytes array, the threshold is defined by a 2 bytes value, and each weight by 1 byte and each address by 20 bytes.

#### Solidity example

```solidity
    abi.encodePacked(
        uint16 threshold,
        uint8 weight_1, address signer_1,
        uint8 weight_2, address signer_2,
        ...
        uint8 weight_5, address signer_5
    )
```

#### Single owner example

The example shows the image of a wallet with a single signer with the address 0x2887D26845974587BC1e3526CaF5cCa17b851A31

```
flat signers image:
0x0001012887d26845974587bc1e3526caf5cca17b851a31

0001                                      Threshold
01                                        Weigth of signer 1
2887d26845974587bc1e3526caf5cca17b851a31  Address of signer 1
```

#### Weighted multisig example

The example shows the image of a wallet with a threshold of 4 and the following signers:

| Weight | Address                                      |
|--------|----------------------------------------------|
| 3      | `0xc807cAa254aA6Db747D9c1A3B377FC06b28692b0` |
| 3      | `0xBc3B96b40c49eA41D01093bd8b7d4c9b6dc2A695` |
| 1      | `0xfF60A7AE7Eee0Ac50cf67796C10001EE4A48C679` |
| 1      | `0x3FF9B9B9739d71Adc834aC4Ed28C7Db4EC9C3f6E` |
| 1      | `0xa924932d16e15786DeaDb7002A216458Fad9fAb6` |

```
flat signers image:
0x0004013ff9b9b9739d71adc834ac4ed28c7db4ec9c3f6e01a924932d16e15786
deadb7002a216458fad9fab603bc3b96b40c49ea41d01093bd8b7d4c9b6dc2a695
03c807caa254aa6db747d9c1a3b377fc06b28692b001ff60a7ae7eee0ac50cf677
96c10001ee4a48c679

0004                                      Threshold
01                                        Weigth of signer 4
3ff9b9b9739d71adc834ac4ed28c7db4ec9c3f6e  Address of signer 4
01                                        Weigth of signer 5
a924932d16e15786deadb7002a216458fad9fab6  Address of signer 5
03                                        Weigth of signer 2
bc3b96b40c49ea41d01093bd8b7d4c9b6dc2a695  Address of signer 2
03                                        Weigth of signer 1
c807caa254aa6db747d9c1a3b377fc06b28692b0  Address of signer 1
01                                        Weigth of signer 3
ff60a7ae7eee0ac50cf67796c10001ee4a48c679  Address of signer 3
```

> Notice: The provided example orders the addresses in ascending order, it's recommended to order the addresses using a consistent method.

### Hashed image

The hashed image is obtained by performing a `keccak256` hash of the `signers image`.

## Wallet deployment <a name="deployment"></a>

The wallet can be deployed by any Ethereum account by calling the method `deploy` of the Factory contract.

This method takes two parameters, `_mainModule` points to the initial implementation of the wallet; for this setup, it should be an instance of the `MainModuleFixed` contract. 

The `hashed image` must be passed as the `_salt` parameter; this allows the wallet to validate signed messages.

### Wallet address

The address of the wallet is determined by the EVM CREATE2 specification and can be obtained by calling the method `addressOf` of the factory contract or by computing the create2 result.

```
keccak256(
    abi.encodePacked(
        bytes1(0xff),        // CREATE2 prefix
        factoryContract,     // Factory of the wallet
        _salt,               // `hashed image` of the wallet
        Wallet.creationCode  // Creation code of the wallet
    )
)[12:]
```

> The wallet address can be computed independently of the deployment of the wallet.

# Signing messages <a name="wallet-creation"></a>

TODO
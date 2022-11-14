import { ethers as hardhat, web3 } from 'hardhat'
import { ethers, BigNumberish } from 'ethers'
import {
  expect,
  signAndExecuteMetaTx,
  RevertError,
  RevertOutOfGasError,
  RevertCallException,
  ethSign,
  encodeImageHash,
  walletSign,
  walletMultiSign,
  multiSignAndExecuteMetaTx,
  encodeNonce,
  moduleStorageKey,
  encodeMetaTransactionsData,
  addressOf,
  multiSignMetaTransactions,
  compareAddr,
  nextNonce,
  encodeMessageData,
  MetaTransactionsType,
  encodeMessageSubDigest
} from './utils'

import {
  Factory__factory,
  MainModule__factory,
  MainModuleUpgradable__factory,
  RequireUtils__factory,
  HookCallerMock__factory,
  CallReceiverMock__factory,
  DelegateCallMock__factory,
  HookMock__factory,
  ModuleMock__factory,
  MainModule,
  MainModuleUpgradable,
  Factory,
  CallReceiverMock,
  ModuleMock,
  HookCallerMock,
  HookMock,
  DelegateCallMock,
  GasBurnerMock,
  RequireUtils,
  GasBurnerMock__factory
} from '../src'

const CallReceiverMockArtifact = artifacts.require('CallReceiverMock')

const optimalGasLimit = ethers.constants.Two.pow(21)

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

contract('MainModule', (accounts: string[]) => {
  let signer: ethers.Signer
  let networkId: number

  let factory: Factory
  let mainModule: MainModule
  let moduleUpgradable: MainModuleUpgradable
  let requireUtils: RequireUtils

  let owner: ethers.Wallet
  let wallet: MainModule

  before(async () => {
    // get signer and provider from hardhat
    signer = (await hardhat.getSigners())[0]
    // provider = hardhat.provider
    
    // Get network ID
    networkId = process.env.NET_ID ? Number(process.env.NET_ID) : await web3.eth.net.getId()

    // Deploy wallet factory
    factory = await (new Factory__factory()).connect(signer).deploy()
    // Deploy MainModule
    mainModule = await (new MainModule__factory()).connect(signer).deploy(factory.address)
    moduleUpgradable = await (new MainModuleUpgradable__factory()).connect(signer).deploy()

    // Deploy RequireUtils
    requireUtils = await (new RequireUtils__factory()).connect(signer).deploy(factory.address, mainModule.address)
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
    wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)
  })

  describe('Nested signatures', () => {
    it('Should accept simple nested signed ERC1271 message', async () => {
      const hookMock = await (new HookCallerMock__factory()).connect(signer).deploy()

      // WalletA
      const owner_a = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_a = encodeImageHash(1, [{ weight: 1, address: owner_a.address }])
      await factory.deploy(mainModule.address, salt_a, { gasLimit: 100_000 })
      const wallet_a = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_a), signer)

      // Top level wallet
      const salt = encodeImageHash(1, [{ weight: 1, address: wallet_a.address }])
      await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
      const wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)

      const message = ethers.utils.hexlify(ethers.utils.randomBytes(95))

      const topLevelDigest = ethers.utils.keccak256(
        encodeMessageData(
          wallet.address,
          message,
          networkId
        )
      )

      const walletADigest = ethers.utils.keccak256(
        encodeMessageSubDigest(
          wallet_a.address,
          topLevelDigest,
          networkId
        )
      )

      const signedWalletA = await walletMultiSign(
        [{ weight: 1, owner: owner_a }],
        1,
        walletADigest,
        false,
        true
      ) + '03'

      const topLevelSigned = await walletMultiSign(
        [{ weight: 1, owner: wallet_a.address, signature: signedWalletA}],
        1,
        topLevelDigest,
        false,
        true
      )

      await hookMock.callERC1271isValidSignatureData(wallet.address, message, topLevelSigned)
    })

    it('Should accept simple nested signer', async () => {
      // WalletA
      const owner_a = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_a = encodeImageHash(1, [{ weight: 1, address: owner_a.address }])
      await factory.deploy(mainModule.address, salt_a, { gasLimit: 100_000 })
      const wallet_a = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_a), signer)

      // Top level wallet
      const salt = encodeImageHash(1, [{ weight: 1, address: wallet_a.address }])
      await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
      const wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)

      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      const topLevelDigest = ethers.utils.keccak256(
        encodeMetaTransactionsData(
          wallet.address,
          [transaction],
          networkId,
          await nextNonce(wallet)
        )
      )

      const walletADigest = ethers.utils.keccak256(
        encodeMessageSubDigest(
          wallet_a.address,
          topLevelDigest,
          networkId
        )
      )

      const signedWalletA = await walletMultiSign(
        [{ weight: 1, owner: owner_a }],
        1,
        walletADigest,
        false,
        true
      ) + '03'

      const topLevelSigned = await walletMultiSign(
        [{ weight: 1, owner: wallet_a.address, signature: signedWalletA}],
        1,
        topLevelDigest,
        false,
        true
      )

      await wallet.execute([transaction], await nextNonce(wallet), topLevelSigned)

      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })

    it('Should accept two nested signers', async () => {
      // WalletA
      const owner_a = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_a = encodeImageHash(1, [{ weight: 1, address: owner_a.address }])
      await factory.deploy(mainModule.address, salt_a, { gasLimit: 100_000 })
      const wallet_a = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_a), signer)

      // WalletB
      const owner_b = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_b = encodeImageHash(1, [{ weight: 1, address: owner_b.address }])
      await factory.deploy(mainModule.address, salt_b, { gasLimit: 100_000 })
      const wallet_b = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_b), signer)

      // Top level wallet
      const salt = encodeImageHash(2, [{ weight: 1, address: wallet_a.address }, { weight: 1, address: wallet_b.address }])
      await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
      const wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)

      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      const topLevelDigest = ethers.utils.keccak256(
        encodeMetaTransactionsData(
          wallet.address,
          [transaction],
          networkId,
          await nextNonce(wallet)
        )
      )

      // Sign using wallet A
      const signedWalletA = await walletMultiSign(
        [{ weight: 1, owner: owner_a }],
        1,
        encodeMessageSubDigest(
          wallet_a.address,
          topLevelDigest,
          networkId
        )  
      ) + '03'

      // Sign using wallet B
      const signedWalletB = await walletMultiSign(
        [{ weight: 1, owner: owner_b }],
        1,
        encodeMessageSubDigest(
          wallet_b.address,
          topLevelDigest,
          networkId
        )
      ) + '03'

      const topLevelSigned = await walletMultiSign(
        [
          { weight: 1, owner: wallet_a.address, signature: signedWalletA},
          { weight: 1, owner: wallet_b.address, signature: signedWalletB}
        ],
        2,
        topLevelDigest,
        false,
        true
      )

      await wallet.execute([transaction], await nextNonce(wallet), topLevelSigned)

      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })

    it('Should accept mixed nested and eoa signers', async () => {
      // Wallet A
      const owner_a = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_a = encodeImageHash(1, [{ weight: 1, address: owner_a.address }])
      await factory.deploy(mainModule.address, salt_a, { gasLimit: 100_000 })
      const wallet_a = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_a), signer)

      // Owner B
      const owner_b = new ethers.Wallet(ethers.utils.randomBytes(32))

      // Top level wallet
      const salt = encodeImageHash(2, [{ weight: 1, address: wallet_a.address }, { weight: 1, address: owner_b.address }])
      await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
      const wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)

      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      const topLevelDigest = ethers.utils.keccak256(
        encodeMetaTransactionsData(
          wallet.address,
          [transaction],
          networkId,
          await nextNonce(wallet)
        )
      )

      // Sign using wallet A
      const signedWalletA = await walletMultiSign(
        [{ weight: 1, owner: owner_a }],
        1,
        encodeMessageSubDigest(
          wallet_a.address,
          topLevelDigest,
          networkId
        )  
      ) + '03'

      const topLevelSigned = await walletMultiSign(
        [
          { weight: 1, owner: wallet_a.address, signature: signedWalletA},
          { weight: 1, owner: owner_b}
        ],
        2,
        topLevelDigest,
        false,
        true
      )

      await wallet.execute([transaction], await nextNonce(wallet), topLevelSigned)

      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })

    const cases = [{
      name: "2 nested sequence wallets",
      childs: 1,
      depth: 2
    }, {
      name: "64 nested sequence wallets",
      childs: 1,
      depth: 64
    }, {
      name: "97 nested sequence wallets",
      childs: 1,
      depth: 97
    }, {
      name: "binary tree of sequence wallets",
      childs: 2,
      depth: 5
    }, {
      name: "ternary tree of sequence wallets",
      childs: 3,
      depth: 4
    }, {
      name: "hexary tree of sequence wallets",
      childs: 16,
      depth: 2
    }, {
      name: "random tree of sequence wallets (depth 1)",
      depth: 1
    }, {
      name: "random tree of sequence wallets (depth 2)",
      depth: 2
    }, {
      name: "random tree of sequence wallets (depth 3)",
      depth: 3
    }, {
      name: "random tree of sequence wallets (depth 4)",
      depth: 4
    }]

    cases.map((c) => {
      it(`Should handle ${c.name}`, async () => {
        type Node = {
          owner: MainModule | ethers.Wallet,
          childs?: Node[]
        }
  
        const gen = async (depth: number, numChilds: number | undefined, max: number): Promise<Node> => {
          let nchilds = numChilds ? numChilds : Math.floor((Math.random() * 5) + 1)
          nchilds = depth === 0 && nchilds === 0 ? 1 : nchilds
          if (depth === max || nchilds === 0) {
            return {
              owner: new ethers.Wallet(ethers.utils.randomBytes(32))
            }
          }
  
          const childs = await Promise.all([...new Array(nchilds)].map(() => gen(depth + 1, numChilds, max)))
          const salt = encodeImageHash(childs.length, childs.map((c) => ({ weight: 1, address: c.owner.address })))
  
          await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
          const wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)
  
          return {
            owner: wallet,
            childs: childs
          }
        }
  
  
        const sign = async (node: Node, digest: string): Promise<string> => {
          if (node.childs) {
            const subDigest = ethers.utils.keccak256(
              encodeMessageSubDigest(
                node.owner.address,
                digest,
                networkId
              )
            )
  
            const signatures = await Promise.all(node.childs.map(async (c) => await sign(c, subDigest) + (c.childs ? '03' : '')))
            return await walletMultiSign(
              node.childs.map((c, i) => ({ weight: 1, owner: c.owner.address, signature: signatures[i] })),
              node.childs.length,
              digest,
              false,
              true
            )
          }
  
          const eoas = await ethSign(node.owner as ethers.Wallet, digest, true)
          return eoas
        }
  
        const tree = await gen(0, c.childs, c.depth)
  
        const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()
  
        const valA = 5423
        const valB = web3.utils.randomHex(120)
  
        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
  
        const topLevelDigest = ethers.utils.defaultAbiCoder.encode(['uint256', MetaTransactionsType], [await nextNonce(tree.owner as MainModule), [transaction]])
  
        const signature = await sign(tree, ethers.utils.keccak256(topLevelDigest))
        await (tree.owner as MainModule).execute([transaction], await nextNonce(wallet), signature)

        expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
        expect(await callReceiver.lastValB()).to.equal(valB)
      })
    })

    it('Should reject invalid nested signature', async () => {
      // WalletA
      const owner_a = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_a = encodeImageHash(1, [{ weight: 1, address: owner_a.address }])
      await factory.deploy(mainModule.address, salt_a, { gasLimit: 100_000 })
      const wallet_a = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_a), signer)

      // WalletB
      const owner_b = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_b = encodeImageHash(1, [{ weight: 1, address: owner_b.address }])
      await factory.deploy(mainModule.address, salt_b, { gasLimit: 100_000 })
      const wallet_b = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_b), signer)

      // Top level wallet
      const salt = encodeImageHash(2, [{ weight: 1, address: wallet_a.address }, { weight: 1, address: wallet_b.address }])
      await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
      const wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)

      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      const topLevelDigest = ethers.utils.keccak256(
        encodeMetaTransactionsData(
          wallet.address,
          [transaction],
          networkId,
          await nextNonce(wallet)
        )
      )

      // Sign using wallet A
      const signedWalletA = await walletMultiSign(
        [{ weight: 1, owner: owner_a }],
        1,
        encodeMessageSubDigest(
          wallet_a.address,
          topLevelDigest,
          networkId
        )  
      ) + '03'

      // Sign using wallet A again (invalid)
      const signedWalletB = await walletMultiSign(
        [{ weight: 1, owner: owner_a }],
        1,
        encodeMessageSubDigest(
          wallet_b.address,
          topLevelDigest,
          networkId
        )
      ) + '03'

      const topLevelSigned = await walletMultiSign(
        [
          { weight: 1, owner: wallet_a.address, signature: signedWalletA},
          { weight: 1, owner: wallet_b.address, signature: signedWalletB}
        ],
        2,
        topLevelDigest,
        false,
        true
      )

      const tx = wallet.execute([transaction], await nextNonce(wallet), topLevelSigned)
      await expect(tx).to.be.rejectedWith(RevertError('ModuleAuth#_signatureValidation: INVALID_SIGNATURE'))
    })

    it('Should enforce threshold on nested sigantures', async () => {
      // WalletA
      const owner_a = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_a = encodeImageHash(1, [{ weight: 1, address: owner_a.address }])
      await factory.deploy(mainModule.address, salt_a, { gasLimit: 100_000 })
      const wallet_a = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_a), signer)

      // WalletB
      const owner_b = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_b = encodeImageHash(1, [{ weight: 1, address: owner_b.address }])
      await factory.deploy(mainModule.address, salt_b, { gasLimit: 100_000 })
      const wallet_b = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_b), signer)

      // Top level wallet
      const salt = encodeImageHash(3, [{ weight: 1, address: wallet_a.address }, { weight: 1, address: wallet_b.address }])
      await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
      const wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)

      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      const topLevelDigest = ethers.utils.keccak256(
        encodeMetaTransactionsData(
          wallet.address,
          [transaction],
          networkId,
          await nextNonce(wallet)
        )
      )

      // Sign using wallet A
      const signedWalletA = await walletMultiSign(
        [{ weight: 1, owner: owner_a }],
        1,
        encodeMessageSubDigest(
          wallet_a.address,
          topLevelDigest,
          networkId
        )  
      ) + '03'

      // Sign using wallet B
      const signedWalletB = await walletMultiSign(
        [{ weight: 1, owner: owner_b }],
        1,
        encodeMessageSubDigest(
          wallet_b.address,
          topLevelDigest,
          networkId
        )
      ) + '03'

      const topLevelSigned = await walletMultiSign(
        [
          { weight: 1, owner: wallet_a.address, signature: signedWalletA},
          { weight: 1, owner: wallet_b.address, signature: signedWalletB}
        ],
        2,
        topLevelDigest,
        false,
        true
      )

      const tx = wallet.execute([transaction], await nextNonce(wallet), topLevelSigned)
      await expect(tx).to.be.rejectedWith(RevertError('ModuleCalls#execute: INVALID_SIGNATURE'))
    })

    it('Should read weight of nested wallets', async () => {
      // WalletA
      const owner_a = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_a = encodeImageHash(1, [{ weight: 1, address: owner_a.address }])
      await factory.deploy(mainModule.address, salt_a, { gasLimit: 100_000 })
      const wallet_a = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_a), signer)

      // WalletB
      const owner_b = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_b = encodeImageHash(1, [{ weight: 1, address: owner_b.address }])
      await factory.deploy(mainModule.address, salt_b, { gasLimit: 100_000 })
      const wallet_b = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_b), signer)

      // WalletC
      const owner_c = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt_c = encodeImageHash(1, [{ weight: 1, address: owner_c.address }])
      await factory.deploy(mainModule.address, salt_c, { gasLimit: 100_000 })
      const wallet_c = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt_c), signer)

      // Top level wallet
      const salt = encodeImageHash(2, [{ weight: 1, address: wallet_a.address }, { weight: 1, address: wallet_b.address }, { weight: 2, address: wallet_c.address }])
      await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
      const wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)

      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      const topLevelDigest = ethers.utils.keccak256(
        encodeMetaTransactionsData(
          wallet.address,
          [transaction],
          networkId,
          await nextNonce(wallet)
        )
      )

      // Sign using wallet A
      const signedWalletA = await walletMultiSign(
        [{ weight: 1, owner: owner_a }],
        1,
        encodeMessageSubDigest(
          wallet_a.address,
          topLevelDigest,
          networkId
        )  
      ) + '03'

      // Sign using wallet B
      const signedWalletB = await walletMultiSign(
        [{ weight: 1, owner: owner_b }],
        1,
        encodeMessageSubDigest(
          wallet_b.address,
          topLevelDigest,
          networkId
        )
      ) + '03'

      // Sign using wallet C
      const signedWalletC = await walletMultiSign(
        [{ weight: 1, owner: owner_c }],
        1,
        encodeMessageSubDigest(
          wallet_c.address,
          topLevelDigest,
          networkId
        )
      ) + '03'

      const topLevelSignedOnlyA = await walletMultiSign(
        [{
          weight: 1, owner: wallet_a.address, signature: signedWalletA
        }, {
          weight: 1, owner: wallet_b.address
        }, {
          weight: 2, owner: wallet_c.address
        }],
        2,
        topLevelDigest,
        false,
        true
      )

      let tx = wallet.execute([transaction], await nextNonce(wallet), topLevelSignedOnlyA)
      await expect(tx).to.be.rejectedWith(RevertError('ModuleCalls#execute: INVALID_SIGNATURE'))

      const topLevelSignedOnlyB = await walletMultiSign(
        [{
          weight: 1, owner: wallet_a.address
        }, {
          weight: 1, owner: wallet_b.address, signature: signedWalletB
        }, {
          weight: 2, owner: wallet_c.address
        }],
        2,
        topLevelDigest,
        false,
        true
      )

      tx = wallet.execute([transaction], await nextNonce(wallet), topLevelSignedOnlyB)
      await expect(tx).to.be.rejectedWith(RevertError('ModuleCalls#execute: INVALID_SIGNATURE'))

      const topLevelSignedOnlyC = await walletMultiSign(
        [{
          weight: 1, owner: wallet_a.address
        }, {
          weight: 1, owner: wallet_b.address
        }, {
          weight: 2, owner: wallet_c.address, signature: signedWalletC
        }],
        2,
        topLevelDigest,
        false,
        true
      )

      await wallet.execute([transaction], await nextNonce(wallet), topLevelSignedOnlyC)

      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
  })

  describe('Authentication', () => {
    it('Should accept initial owner signature', async () => {
      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
    })
    it('Should reject non-owner signature', async () => {
      const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      const tx = signAndExecuteMetaTx(wallet, impostor, [transaction], networkId)
      await expect(tx).to.be.rejectedWith(RevertError('ModuleCalls#execute: INVALID_SIGNATURE'))
    })
    describe('Network ID', () => {
      it('Should reject a transaction of another network id', async () => {
        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: ethers.constants.AddressZero,
          value: ethers.constants.Zero,
          data: []
        }

        const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId - 1)
        await expect(tx).to.be.rejectedWith(RevertError('ModuleCalls#execute: INVALID_SIGNATURE'))
      })
    })
    describe('Nonce', () => {
      const spaces = [
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(1),
        ethers.BigNumber.from(7342),
        ethers.BigNumber.from(ethers.utils.randomBytes(20)),
        ethers.constants.Two.pow(160).sub(ethers.constants.One)
      ]

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }
      context('Using non-encoded nonce', () => {
        it('Should default to space zero', async () => {
          const nonce = ethers.constants.Zero

          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, nonce)
          expect((await wallet.nonce()).toNumber()).to.eq.BN(1)
        })
        it('Should work with zero as initial nonce', async () => {
          const nonce = ethers.constants.Zero

          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, nonce)
          expect((await wallet.readNonce(0)).toNumber()).to.eq.BN(1)
        })
        it('Should emit NonceChange event', async () => {
          const receipt1 = await (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, 0)).wait()
          const receipt2 = await (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, 1)).wait()

          const ev1 = receipt1.events?.find(l => l.event === 'NonceChange')!
          expect(ev1.event).to.be.equal('NonceChange')

          expect(ev1.args?._space.toNumber()).to.eq.BN(0)
          expect(ev1.args?._newNonce.toNumber()).to.eq.BN(1)

          const ev2 = receipt2.events?.find(l => l.event === 'NonceChange')!
          expect(ev2.event).to.be.equal('NonceChange')
          expect(ev1.args?._space.toNumber()).to.eq.BN(0)
          expect(ev2.args?._newNonce.toNumber()).to.eq.BN(2)
        })
        it('Should fail if nonce did not change', async () => {
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, ethers.constants.Zero)
          const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId, ethers.constants.Zero)

          await expect(tx).to.be.rejectedWith(RevertError('MainModule#_auth: INVALID_NONCE'))
        })
        it('Should fail if nonce increased by two', async () => {
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, 0)
          const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId, 2)

          await expect(tx).to.be.rejectedWith(RevertError('MainModule#_auth: INVALID_NONCE'))
        })
      })
      spaces.forEach(space => {
        context(`using ${space.toHexString()} space`, () => {
          it('Should work with zero as initial nonce', async () => {
            const nonce = ethers.constants.Zero

            const encodedNonce = encodeNonce(space, nonce)
            await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedNonce)
            expect((await wallet.readNonce(space)).toNumber()).to.eq.BN(1)
          })
          it('Should emit NonceChange event', async () => {
            const encodedFirstNonce = encodeNonce(space, ethers.constants.Zero)
            const encodedSecondNonce = encodeNonce(space, ethers.constants.One)

            const receipt1 = await (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedFirstNonce)).wait()
            const receipt2 = await (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedSecondNonce)).wait()

            const ev1 = receipt1.events?.find(l => l.event === 'NonceChange')!
            expect(ev1.event).to.be.equal('NonceChange')

            expect(ev1.args?._space.toString()).to.eq.BN(space.toString())
            expect(ev1.args?._newNonce.toString()).to.eq.BN(1)

            const ev2 = receipt2.events?.find(l => l.event === 'NonceChange')!
            expect(ev2.event).to.be.equal('NonceChange')
            expect(ev2.args?._space.toString()).to.eq.BN(space.toString())
            expect(ev2.args?._newNonce.toString()).to.eq.BN(2)
          })
          it('Should accept next nonce', async () => {
            const encodedFirstNonce = encodeNonce(space, ethers.constants.Zero)
            const encodedSecondNonce = encodeNonce(space, ethers.constants.One)

            await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedFirstNonce)
            await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedSecondNonce)

            expect((await wallet.readNonce(space)).toNumber()).to.eq.BN(2)
          })
          it('Should fail if nonce did not change', async () => {
            const encodedNonce = encodeNonce(space, ethers.constants.Zero)

            await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedNonce)
            const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedNonce)

            await expect(tx).to.be.rejectedWith(RevertError('MainModule#_auth: INVALID_NONCE'))
          })
          it('Should fail if nonce increased by two', async () => {
            const encodedFirstNonce = encodeNonce(space, ethers.constants.Zero)
            const encodedSecondNonce = encodeNonce(space, ethers.constants.Two)

            await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedFirstNonce)
            const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedSecondNonce)

            await expect(tx).to.be.rejectedWith(RevertError('MainModule#_auth: INVALID_NONCE'))
          })
          it('Should use nonces storage keys', async () => {
            const subkey = ethers.utils.defaultAbiCoder.encode(['uint256'], [space])
            const storageKey = moduleStorageKey('org.arcadeum.module.calls.nonce', subkey)

            const nonce = ethers.constants.Zero

            const encodedNonce = encodeNonce(space, nonce)
            await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedNonce)

            const storageValue = await web3.eth.getStorageAt(wallet.address, storageKey)
            expect(web3.utils.toBN(storageValue)).to.eq.BN(1)
          })
        })
      })
      context('using two spaces simultaneously', () => {
        it('Should keep separated nonce counts', async () => {
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(1, 0))

          expect((await wallet.readNonce(1)).toNumber()).to.eq.BN(1)
          expect((await wallet.readNonce(2)).toNumber()).to.eq.BN(0)

          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(2, 0))

          expect((await wallet.readNonce(1)).toNumber()).to.eq.BN(1)
          expect((await wallet.readNonce(2)).toNumber()).to.eq.BN(1)

          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(2, 1))
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(2, 2))

          expect((await wallet.readNonce(1)).toNumber()).to.eq.BN(1)
          expect((await wallet.readNonce(2)).toNumber()).to.eq.BN(3)
        })
        it('Should emit different events', async () => {
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(1, 0))
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(1, 1))

          const receipt1 = await (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(1, 2))).wait()
          const receipt2 = await (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(2, 0))).wait()

          const ev1 = receipt1.events?.find(l => l.event === 'NonceChange')!
          expect(ev1.event).to.be.equal('NonceChange')
          expect(ev1.args?._space.toNumber()).to.eq.BN(1)
          expect(ev1.args?._newNonce.toNumber()).to.eq.BN(3)

          const ev2 = receipt2.events?.find(l => l.event === 'NonceChange')!
          expect(ev2.event).to.be.equal('NonceChange')
          expect(ev2.args?._space.toNumber()).to.eq.BN(2)
          expect(ev2.args?._newNonce.toNumber()).to.eq.BN(1)
        })
        it('Should not accept nonce of different space', async () => {
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(1, 0))
          const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(2, 1))
          await expect(tx).to.be.rejectedWith(RevertError('MainModule#_auth: INVALID_NONCE'))
        })
      })
    })
    it('Should reject signature with invalid flag', async () => {
      const signature = '0x00010301'
      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      const tx = wallet.execute([transaction], 0, signature)
      await expect(tx).to.be.rejectedWith(RevertError('ModuleAuth#_signatureValidation INVALID_FLAG'))
    })
  })

  describe('Upgradeability', () => {
    it('Should update implementation', async () => {
      const newImplementation = await (new ModuleMock__factory()).connect(signer).deploy()

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.interface.encodeFunctionData('updateImplementation', [newImplementation.address])
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)

      const mock_wallet = await ModuleMock__factory.connect(wallet.address, signer)
      expect((await (await mock_wallet.ping()).wait()).events![0].event).to.equal('Pong')
    })
    it('Should fail to set implementation to address 0', async () => {
      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.interface.encodeFunctionData('updateImplementation', [ethers.constants.AddressZero])
      }

      const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      await expect(tx).to.be.rejectedWith(RevertError('ModuleUpdate#updateImplementation: INVALID_IMPLEMENTATION'))
    })
    it('Should fail to set implementation to non-contract', async () => {
      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.interface.encodeFunctionData('updateImplementation', [accounts[1]])
      }

      const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      await expect(tx).to.be.rejectedWith(RevertError('ModuleUpdate#updateImplementation: INVALID_IMPLEMENTATION'))
    })
    it('Should use implementation storage key', async () => {
      const newImplementation = await (new ModuleMock__factory()).connect(signer).deploy()

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.interface.encodeFunctionData('updateImplementation', [newImplementation.address])
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)

      const storageValue = await web3.eth.getStorageAt(wallet.address, wallet.address)

      expect(ethers.utils.getAddress(ethers.utils.defaultAbiCoder.decode(['address'], storageValue)[0])).to.equal(newImplementation.address)
    })
  })

  describe('External calls', () => {
    it('Should perform call to contract', async () => {
      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })

    it('Should return error message', async () => {
      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()
      await callReceiver.setRevertFlag(true)

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.interface.encodeFunctionData('testCall', [0, []])
      }

      const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      await expect(tx).to.be.rejectedWith(RevertError('CallReceiverMock#testCall: REVERT_FLAG'))
    })

    describe('Batch transactions', () => {
      it('Should perform multiple calls to contracts in one tx', async () => {
        const callReceiver1 = await (new CallReceiverMock__factory()).connect(signer).deploy()
        const callReceiver2 = await (new CallReceiverMock__factory()).connect(signer).deploy()

        const val1A = 5423
        const val1B = web3.utils.randomHex(120)

        const val2A = 695412
        const val2B = web3.utils.randomHex(35)

        const transactions = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: callReceiver1.address,
            value: ethers.constants.Zero,
            data: callReceiver1.interface.encodeFunctionData('testCall', [val1A, val1B])
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: callReceiver2.address,
            value: ethers.constants.Zero,
            data: callReceiver2.interface.encodeFunctionData('testCall', [val2A, val2B])
          }
        ]

        await signAndExecuteMetaTx(wallet, owner, transactions, networkId)
        expect((await callReceiver1.lastValA()).toNumber()).to.eq.BN(val1A)
        expect(await callReceiver1.lastValB()).to.equal(val1B)
        expect((await callReceiver2.lastValA()).toNumber()).to.eq.BN(val2A)
        expect(await callReceiver2.lastValB()).to.equal(val2B)
      })

      it('Should perform call a contract and transfer eth in one tx', async () => {
        const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()
        const receiver = new ethers.Wallet(ethers.utils.randomBytes(32))

        await signer.sendTransaction({
          to: wallet.address,
          value: 100
        })

        const valA = 5423
        const valB = web3.utils.randomHex(120)

        const transactions = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: receiver.address,
            value: 26,
            data: []
          }
        ]

        await signAndExecuteMetaTx(wallet, owner, transactions, networkId)
        expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
        expect(await callReceiver.lastValB()).to.equal(valB)
        expect(await web3.eth.getBalance(receiver.address)).to.eq.BN(26)
      })
      it('Should fail if one transaction fails', async () => {
        const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()
        const receiver = new ethers.Wallet(ethers.utils.randomBytes(32))

        await callReceiver.setRevertFlag(true)
        await signer.sendTransaction({
          to: wallet.address,
          value: 100
        })

        const transactions = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: receiver.address,
            value: 26,
            data: []
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [0, []])
          }
        ]

        const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
        await expect(tx).to.be.rejectedWith('CallReceiverMock#testCall: REVERT_FLAG')
      })
    })
  })

  describe('Delegate calls', () => {
    let mockModule: DelegateCallMock

    beforeEach(async () => {
      mockModule = await (new DelegateCallMock__factory()).connect(signer).deploy()
    })

    it('Should delegate call to module', async () => {
      const transaction1 = {
        delegateCall: true,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: mockModule.address,
        value: 0,
        data: mockModule.interface.encodeFunctionData('write', [11, 45])
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction1], networkId)

      const transaction2 = {
        delegateCall: true,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: mockModule.address,
        value: 0,
        data: mockModule.interface.encodeFunctionData('read', [11])
      }

      const tx = await (await signAndExecuteMetaTx(wallet, owner, [transaction2], networkId)).wait()
      const val = web3.utils.toBN(tx.logs.slice(-2)[0].data)
      expect(val).to.eq.BN(45)
    })
    context('on delegate call revert', () => {
      beforeEach(async () => {
        const transaction = {
          delegateCall: true,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: mockModule.address,
          value: 0,
          data: mockModule.interface.encodeFunctionData('setRevertFlag', [true])
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      })
      it('Should pass if delegate call is optional', async () => {
        const transaction = {
          delegateCall: true,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: mockModule.address,
          value: 0,
          data: mockModule.interface.encodeFunctionData('write', [11, 45])
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      })
      it('Should fail if delegate call fails', async () => {
        const transaction = {
          delegateCall: true,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: mockModule.address,
          value: 0,
          data: mockModule.interface.encodeFunctionData('write', [11, 45])
        }

        const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('DelegateCallMock#write: REVERT_FLAG')
      })
    })
  })

  describe('Handle ETH', () => {
    it('Should receive ETH', async () => {
      await signer.sendTransaction({
        to: wallet.address,
        value: 1
      })
    })
    it('Should transfer ETH', async () => {
      await signer.sendTransaction({
        to: wallet.address,
        value: 100
      })

      const receiver = new ethers.Wallet(ethers.utils.randomBytes(32))

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: receiver.address,
        value: 25,
        data: []
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      expect(await web3.eth.getBalance(receiver.address)).to.eq.BN(25)
    })
    it('Should call payable function', async () => {
      await signer.sendTransaction({
        to: wallet.address,
        value: 100
      })

      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const valA = 63129
      const valB = web3.utils.randomHex(120)
      const value = 33

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: value,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      expect(await web3.eth.getBalance(callReceiver.address)).to.eq.BN(value)
      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
  })

  describe('Optional transactions', () => {
    it('Should skip a skipOnError transaction', async () => {
      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()
      await callReceiver.setRevertFlag(true)

      const data = callReceiver.interface.encodeFunctionData('testCall', [0, []])

      const transaction = {
        delegateCall: false,
        revertOnError: false,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: data
      }

      const tx = await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      const receipt = await tx.wait()
      const event = receipt.events?.pop()!

      const reason = web3.eth.abi.decodeParameter('string', event.args?._reason.slice(10))

      expect(reason).to.equal('CallReceiverMock#testCall: REVERT_FLAG')

      expect(event.args?._index).to.eq.BN(0)
    })
    it('Should skip failing transaction within batch', async () => {
      const callReceiver1 = await (new CallReceiverMock__factory()).connect(signer).deploy()
      const callReceiver2 = await (new CallReceiverMock__factory()).connect(signer).deploy()

      await callReceiver1.setRevertFlag(true)

      const valA = 912341
      const valB = web3.utils.randomHex(30)

      const data1 = callReceiver1.interface.encodeFunctionData('testCall', [0, []])
      const data2 = callReceiver2.interface.encodeFunctionData('testCall', [valA, valB])

      const transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: callReceiver1.address,
          value: ethers.constants.Zero,
          data: data1
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver2.address,
          value: ethers.constants.Zero,
          data: data2
        }
      ]

      const tx = await (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)).wait()
      const event = tx.events?.find(l => l.event === 'TxFailed')!

      const reason = web3.eth.abi.decodeParameter('string', event.args?._reason.slice(10))

      expect(reason).to.equal('CallReceiverMock#testCall: REVERT_FLAG')

      expect((await callReceiver2.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver2.lastValB()).to.equal(valB)
    })
    it('Should skip multiple failing transactions within batch', async () => {
      const callReceiver1 = await (new CallReceiverMock__factory()).connect(signer).deploy()
      const callReceiver2 = await (new CallReceiverMock__factory()).connect(signer).deploy()

      await callReceiver1.setRevertFlag(true)

      const valA = 912341
      const valB = web3.utils.randomHex(30)

      const data1 = callReceiver1.interface.encodeFunctionData('testCall', [0, []])
      const data2 = callReceiver2.interface.encodeFunctionData('testCall', [valA, valB])

      const transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: callReceiver1.address,
          value: ethers.constants.Zero,
          data: data1
        },
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: callReceiver1.address,
          value: ethers.constants.Zero,
          data: data1
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver2.address,
          value: ethers.constants.Zero,
          data: data2
        }
      ]

      const txHash = ethers.utils.keccak256(encodeMetaTransactionsData(wallet.address, transactions, networkId, 0))

      const tx = await (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)).wait()

      const event1 = tx.events![1]
      const event2 = tx.events![2]

      const reason1 = web3.eth.abi.decodeParameter('string', event1.args?._reason.slice(10))
      const reason2 = web3.eth.abi.decodeParameter('string', event2.args?._reason.slice(10))

      expect(reason1).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
      expect(reason2).to.equal('CallReceiverMock#testCall: REVERT_FLAG')

      expect(event1.args?._tx).to.equal(txHash)
      expect(event2.args?._tx).to.equal(txHash)

      expect((await callReceiver2.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver2.lastValB()).to.equal(valB)
    })
    it('Should skip all failing transactions within batch', async () => {
      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      await callReceiver.setRevertFlag(true)

      const data = callReceiver.interface.encodeFunctionData('testCall', [0, []])

      const transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: data
        },
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: data
        }
      ]

      const tx = await (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)).wait()
      const event1 = tx.events?.pop()!
      const event2 = tx.events?.pop()!

      const reason1 = web3.eth.abi.decodeParameter('string', event1.args?._reason.slice(10))
      const reason2 = web3.eth.abi.decodeParameter('string', event2.args?._reason.slice(10))

      expect(reason1).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
      expect(reason2).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
    })

    it('Should skip skipOnError update implementation action', async () => {
      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      await callReceiver.setRevertFlag(true)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('updateImplementation', [ethers.constants.AddressZero])
        }
      ]

      const tx = await (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)).wait()
      const event = tx.events?.pop()!

      const reason = web3.eth.abi.decodeParameter('string', event.args?._reason.slice(10))

      expect(reason).to.equal('ModuleUpdate#updateImplementation: INVALID_IMPLEMENTATION')
      expect((await wallet.nonce()).toNumber()).to.eq.BN(1)
    })
  })

  describe('Hooks', () => {
    let hookMock: HookCallerMock
    before(async () => {
      hookMock = await (new HookCallerMock__factory()).connect(signer).deploy()
    })
    describe('receive tokens', () => {
      it('Should implement ERC1155 single transfer hook', async () => {
        await hookMock.callERC1155Received(wallet.address)
      })
      it('Should implement ERC1155 batch transfer hook', async () => {
        await hookMock.callERC1155BatchReceived(wallet.address)
      })
      it('Should implement ERC721 transfer hook', async () => {
        await hookMock.callERC721Received(wallet.address)
      })
      it('Should implement ERC223 transfer hook', async () => {
        await hookMock.callERC223Received(wallet.address)
      })
    })
    describe('ERC1271 Wallet', () => {
      let data: string
      let messageSubDigest: string
      let hash: string
      let hashSubDigest: string

      beforeEach(async () => {
        data = await web3.utils.randomHex(250)
        messageSubDigest = ethers.utils.solidityPack(
          ['string', 'uint256', 'address', 'bytes'],
          ['\x19\x01', networkId, wallet.address, ethers.utils.keccak256(data)]
        )

        hash = ethers.utils.keccak256(ethers.utils.randomBytes(1024))
        hashSubDigest = ethers.utils.solidityPack(
          ['string', 'uint256', 'address', 'bytes'],
          ['\x19\x01', networkId, wallet.address, ethers.utils.solidityPack(['bytes32'], [hash])]
        )
      })
      it('Should validate arbitrary signed data', async () => {
        const signature = await walletSign(owner, messageSubDigest)
        await hookMock.callERC1271isValidSignatureData(wallet.address, data, signature)
      })
      it('Should validate arbitrary signed hash', async () => {
        const signature = await walletSign(owner, hashSubDigest)
        await hookMock.callERC1271isValidSignatureHash(wallet.address, hash, signature)
      })
      it('Should reject data signed by non-owner', async () => {
        const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
        const signature = await walletSign(impostor, messageSubDigest)
        const tx = hookMock.callERC1271isValidSignatureData(wallet.address, data, signature)
        await expect(tx).to.be.rejectedWith('HookCallerMock#callERC1271isValidSignatureData: INVALID_RETURN')
      })
      it('Should reject hash signed by non-owner', async () => {
        const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
        const signature = await walletSign(impostor, hashSubDigest)
        const tx = hookMock.callERC1271isValidSignatureHash(wallet.address, hash, signature)
        await expect(tx).to.be.rejectedWith('HookCallerMock#callERC1271isValidSignatureHash: INVALID_RETURN')
      })
    })

    describe('External hooks', () => {
      let hookMock: HookMock
      before(async () => {
        hookMock = await (new HookMock__factory()).connect(signer).deploy()
      })
      it('Should read added hook', async () => {
        const selector = ethers.utils.id('onHookMockCall(uint256)').substring(0, 10)

        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('addHook', [selector, hookMock.address])
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)

        expect(await wallet.readHook(selector)).to.be.equal(hookMock.address)
      })
      it('Should return zero if hook is not registered', async () => {
        const selector = ethers.utils.id('onHookMockCall(uint256)').substring(0, 10)
        expect(await wallet.readHook(selector)).to.be.equal(ethers.constants.AddressZero)
      })
      it('Should forward call to external hook', async () => {
        const selector = ethers.utils.id('onHookMockCall(uint256)').substring(0, 10)
        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('addHook', [selector, hookMock.address])
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)

        const walletHook = await (new HookMock__factory()).connect(signer).deploy()
        expect((await walletHook.onHookMockCall(21)).toNumber()).to.eq.BN(42)
      })
      it('Should not forward call to deregistered hook', async () => {
        const selector = ethers.utils.id('onHookMockCall(uint256)').substring(0, 10)
        const transaction1 = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('addHook', [selector, hookMock.address])
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction1], networkId)

        const transaction2 = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('removeHook', [selector])
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction2], networkId)

        const walletHook = await HookMock__factory.connect(wallet.address, signer)
        const tx = walletHook.onHookMockCall(21)
        await expect(tx).to.be.rejectedWith(RevertCallException())
      })
      it('Should pass calling a non registered hook', async () => {
        const selector = ethers.utils.id('onHookMockCall(uint256)').substring(0, 10)
        const data = ethers.utils.defaultAbiCoder.encode(['bytes4'], [selector])
        await web3.eth.sendTransaction({ from: accounts[0], to: wallet.address, data: data })
      })
      it('Should use hooks storage key', async () => {
        const selector = ethers.utils.id('onHookMockCall(uint256)').substring(0, 10)
        const subkey = ethers.utils.defaultAbiCoder.encode(['bytes4'], [selector])
        const storageKey = moduleStorageKey('org.arcadeum.module.hooks.hooks', subkey)

        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('addHook', [selector, hookMock.address])
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
        const storageValue = await web3.eth.getStorageAt(wallet.address, storageKey)

        const addr = (() => {
          try {
            return ethers.utils.getAddress(ethers.utils.defaultAbiCoder.decode(['address'], storageValue)[0])
          } catch {
            return ethers.utils.getAddress(storageValue)
          }
        })()

        expect(addr).to.equal(hookMock.address)
      })
    })
  })

  describe('Publish configuration', () => {
    context('publishConfig', () => {
      let wallet2addr: string
      let salt2: string
      let owner2: ethers.Wallet
      let threshold = 1
      beforeEach(async () => {
        owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
        salt2 = encodeImageHash(threshold, [{ weight: 1, address: owner2.address }])
        wallet2addr = addressOf(factory.address, mainModule.address, salt2)
      })
      it('Should publish configuration of a non-deployed wallet', async () => {
        await signAndExecuteMetaTx(
          wallet,
          owner,
          [
            {
              delegateCall: false,
              revertOnError: true,
              gasLimit: ethers.constants.Zero,
              target: requireUtils.address,
              value: ethers.constants.Zero,
              data: requireUtils.interface.encodeFunctionData('publishConfig', [
                wallet2addr, threshold, [
                  {
                    signer: owner2.address,
                    weight: 1
                  }
                ], false
              ])
            }
          ],
          networkId
        )

        const blockHeight1 = await requireUtils.lastWalletUpdate(wallet2addr)
        const blockHeight2 = await requireUtils.lastImageHashUpdate(salt2)
        expect(blockHeight1.toNumber()).to.equal(0)
        expect(blockHeight2.toNumber()).to.equal(0)

        expect(await requireUtils.knownImageHashes(wallet2addr)).to.equal(ethers.constants.HashZero)
      })
      it('Should publish configuration of deployed wallet', async () => {
        await factory.deploy(mainModule.address, salt2, { gasLimit: 100_000 })
        const wallet2 = await MainModule__factory.connect(wallet2addr, signer)
        await signAndExecuteMetaTx(
          wallet2,
          owner2,
          [
            {
              delegateCall: false,
              revertOnError: true,
              gasLimit: ethers.constants.Zero,
              target: requireUtils.address,
              value: ethers.constants.Zero,
              data: requireUtils.interface.encodeFunctionData('publishConfig', [
                wallet2.address, threshold, [
                  {
                    signer: owner2.address,
                    weight: 1
                  }
                ], false
              ])
            }
          ],
          networkId
        )

        const blockHeight1 = await requireUtils.lastWalletUpdate(wallet2addr)
        const blockHeight2 = await requireUtils.lastImageHashUpdate(salt2)
        expect(blockHeight1.toNumber()).to.equal(0)
        expect(blockHeight2.toNumber()).to.equal(0)

        expect(await requireUtils.knownImageHashes(wallet2addr)).to.equal(ethers.constants.HashZero)
      })
      it('Should fail to publish wrong configuraiton of a non-deployed wallet', async () => {
        const tx = signAndExecuteMetaTx(
          wallet,
          owner,
          [
            {
              delegateCall: false,
              revertOnError: true,
              gasLimit: ethers.constants.Zero,
              target: requireUtils.address,
              value: ethers.constants.Zero,
              data: requireUtils.interface.encodeFunctionData('publishConfig', [
                wallet2addr, threshold, [
                  {
                    signer: owner2.address,
                    weight: 2
                  }
                ], false
              ])
            }
          ],
          networkId
        )
        await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#publishConfig: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH'))
      })
      it('Should fail to publish wrong configuration of a non-updated wallet', async () => {
        await factory.deploy(mainModule.address, salt2, { gasLimit: 100_000 })
        const wallet2 = await MainModule__factory.connect(wallet2addr, signer)
        const tx = signAndExecuteMetaTx(
          wallet2,
          owner2,
          [
            {
              delegateCall: false,
              revertOnError: true,
              gasLimit: ethers.constants.Zero,
              target: requireUtils.address,
              value: ethers.constants.Zero,
              data: requireUtils.interface.encodeFunctionData('publishConfig', [
                wallet2.address, threshold, [
                  {
                    signer: owner2.address,
                    weight: 2
                  }
                ], false
              ])
            }
          ],
          networkId
        )
        await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#publishConfig: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH'))
      })
    })
    context('publishConfig indexed', () => {
      let wallet2addr: string
      let salt2: string
      let owner2: ethers.Wallet
      let threshold = 1
      beforeEach(async () => {
        owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
        salt2 = encodeImageHash(threshold, [{ weight: 1, address: owner2.address }])
        wallet2addr = addressOf(factory.address, mainModule.address, salt2)
      })
      it('Should publish configuration of a non-deployed wallet', async () => {
        const tx = await signAndExecuteMetaTx(
          wallet,
          owner,
          [
            {
              delegateCall: false,
              revertOnError: true,
              gasLimit: ethers.constants.Zero,
              target: requireUtils.address,
              value: ethers.constants.Zero,
              data: requireUtils.interface.encodeFunctionData('publishConfig', [
                wallet2addr, threshold, [
                  {
                    signer: owner2.address,
                    weight: 1
                  }
                ], true
              ])
            }
          ],
          networkId
        )

        const receipt = await tx.wait()

        const blockHeight1 = await requireUtils.lastWalletUpdate(wallet2addr)
        const blockHeight2 = await requireUtils.lastImageHashUpdate(salt2)
        expect(receipt.blockNumber).to.equal(blockHeight1.toNumber())
        expect(blockHeight1.toNumber()).to.equal(blockHeight2.toNumber())

        expect(await requireUtils.knownImageHashes(wallet2addr)).to.equal(salt2)
      })
      it('Should publish configuration of a deployed wallet', async () => {
        await factory.deploy(mainModule.address, salt2, { gasLimit: 100_000 })
        const wallet2 = await MainModule__factory.connect(wallet2addr, signer)
        const tx = await signAndExecuteMetaTx(
          wallet2,
          owner2,
          [
            {
              delegateCall: false,
              revertOnError: true,
              gasLimit: ethers.constants.Zero,
              target: requireUtils.address,
              value: ethers.constants.Zero,
              data: requireUtils.interface.encodeFunctionData('publishConfig', [
                wallet2.address, threshold, [
                  {
                    signer: owner2.address,
                    weight: 1
                  }
                ], true
              ])
            }
          ],
          networkId
        )

        const receipt = await tx.wait()

        const blockHeight1 = await requireUtils.lastWalletUpdate(wallet2.address)
        const blockHeight2 = await requireUtils.lastImageHashUpdate(salt2)
        expect(receipt.blockNumber).to.equal(blockHeight1.toNumber())
        expect(blockHeight1.toNumber()).to.equal(blockHeight2.toNumber())

        expect(await requireUtils.knownImageHashes(wallet2addr)).to.equal(salt2)
      })
      it('Should publish configuration of an updated wallet', async () => {
        await factory.deploy(mainModule.address, salt2, { gasLimit: 100_000 })
        const wallet2 = await MainModule__factory.connect(wallet2addr, signer)

        const newOwnerA = ethers.Wallet.createRandom()
        const newImageHash = encodeImageHash(1, [{ weight: 1, address: newOwnerA.address }])

        const newWallet = await MainModuleUpgradable__factory.connect(wallet2.address, signer)

        const migrateBundle = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Two.pow(18),
            target: newWallet.address,
            value: ethers.constants.Zero,
            data: newWallet.interface.encodeFunctionData('updateImplementation', [moduleUpgradable.address])
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Two.pow(18),
            target: newWallet.address,
            value: ethers.constants.Zero,
            data: newWallet.interface.encodeFunctionData('updateImageHash', [newImageHash])
          }
        ]

        const migrateTransaction = [
          {
            delegateCall: false,
            revertOnError: false,
            gasLimit: optimalGasLimit,
            target: newWallet.address,
            value: ethers.constants.Zero,
            data: newWallet.interface.encodeFunctionData('selfExecute', [migrateBundle])
          }
        ]

        await signAndExecuteMetaTx(wallet2, owner2, migrateTransaction, networkId)

        const tx = await signAndExecuteMetaTx(
          wallet2,
          newOwnerA,
          [
            {
              delegateCall: false,
              revertOnError: true,
              gasLimit: ethers.constants.Zero,
              target: requireUtils.address,
              value: ethers.constants.Zero,
              data: requireUtils.interface.encodeFunctionData('publishConfig', [
                wallet2.address, threshold, [
                  {
                    signer: newOwnerA.address,
                    weight: 1
                  }
                ], true
              ])
            }
          ],
          networkId
        )

        const receipt = await tx.wait()

        const blockHeight1 = await requireUtils.lastWalletUpdate(wallet2addr)
        const blockHeight2 = await requireUtils.lastImageHashUpdate(newImageHash)
        expect(receipt.blockNumber).to.equal(blockHeight1.toNumber())
        expect(blockHeight1.toNumber()).to.equal(blockHeight2.toNumber())

        expect((await requireUtils.lastImageHashUpdate(salt2)).toNumber()).to.equal(0)

        expect(await requireUtils.knownImageHashes(wallet2addr)).to.equal(ethers.constants.HashZero)
        expect(await requireUtils.knownImageHashes(addressOf(factory.address, mainModule.address, newImageHash))).to.equal(ethers.constants.HashZero)
      })
      it('Should fail to publish wrong configuration of a non-deployed wallet', async () => {
        const tx = signAndExecuteMetaTx(
          wallet,
          owner,
          [
            {
              delegateCall: false,
              revertOnError: true,
              gasLimit: ethers.constants.Zero,
              target: requireUtils.address,
              value: ethers.constants.Zero,
              data: requireUtils.interface.encodeFunctionData('publishConfig', [
                wallet2addr, threshold, [
                  {
                    signer: owner2.address,
                    weight: 2
                  }
                ], true
              ])
            }
          ],
          networkId
        )
        await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#publishConfig: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH'))
      })
      it('Should fail to publish wrong configuration of a deployed wallet', async () => {
        await factory.deploy(mainModule.address, salt2, { gasLimit: 100_000 })
        const wallet2 = await MainModule__factory.connect(wallet2addr, signer)
        const tx = signAndExecuteMetaTx(
          wallet2,
          owner2,
          [
            {
              delegateCall: false,
              revertOnError: true,
              gasLimit: ethers.constants.Zero,
              target: requireUtils.address,
              value: ethers.constants.Zero,
              data: requireUtils.interface.encodeFunctionData('publishConfig', [
                wallet2.address, threshold, [
                  {
                    signer: owner2.address,
                    weight: 2
                  }
                ], true
              ])
            }
          ],
          networkId
        )
        await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#publishConfig: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH'))
      })
    })
    context('publishInitialSigners', () => {
      let wallet2addr: string
      let salt2: string
      let owner2a: ethers.Wallet
      let owner2b: ethers.Wallet
      let owner2c: ethers.Wallet
      let threshold = 2

      let message: string
      let digest: string
      let preSubDigest: string
      let signature: string
      let badSignature: string
      let config: { weight: number, address: string, signer?: ethers.Wallet }[]

      enum SignatureType {
        EOA, EOADynamic, ERC1271
      }

      const options = [{
        name: 'EOA signature indexed',
        signatureType: SignatureType.EOA,
        indexed: true
      }, {
        name: 'EOA signature not indexed',
        signatureType: SignatureType.EOA,
        indexed: false
      }, {
        name: 'dynamic EOA signature indexed',
        signatureType: SignatureType.EOADynamic,
        indexed: true
      }, {
        name: 'dynamic EOA signature not indexed',
        signatureType: SignatureType.EOADynamic,
        indexed: false
      }, {
        name: 'ERC1271 signature indexed',
        signatureType: SignatureType.ERC1271,
        indexed: true
      }, {
        name: 'ERC1271 signature not indexed',
        signatureType: SignatureType.ERC1271,
        indexed: false
      }]

      options.map((o) => {
        context(o.name, () => {
          beforeEach(async () => {
            owner2a = new ethers.Wallet(ethers.utils.randomBytes(32))
            owner2b = new ethers.Wallet(ethers.utils.randomBytes(32))
            owner2c = new ethers.Wallet(ethers.utils.randomBytes(32))
  
            config = [{ weight: 1, address: owner2a.address, signer: owner2a }, { weight: 1, address: owner2b.address, signer: owner2b }, { weight: 1, address: owner2c.address }]
            salt2 = encodeImageHash(threshold, config)
            wallet2addr = addressOf(factory.address, mainModule.address, salt2)
  
            message = ethers.utils.hexlify(ethers.utils.randomBytes(96))
            digest = ethers.utils.keccak256(message)
            preSubDigest = ethers.utils.solidityPack(
              ['string', 'uint256', 'address', 'bytes'],
              ['\x19\x01', networkId, wallet2addr, digest]
            )
  
            switch (o.signatureType) {
              case SignatureType.EOA:
                signature = await walletMultiSign([{ weight: 1, owner: owner2a }, { weight: 1, owner: owner2b }, { weight: 1, owner: owner2c.address }], threshold, preSubDigest)
                break
              case SignatureType.EOADynamic:
                signature = await walletMultiSign([{ weight: 1, owner: owner2a }, { weight: 1, owner: owner2b }, { weight: 1, owner: owner2c.address }], threshold, preSubDigest, true)
                break
              case SignatureType.ERC1271:
                // Deploy nested sequence wallet
                const ownern2a = new ethers.Wallet(ethers.utils.randomBytes(32))
                const ownern2b = new ethers.Wallet(ethers.utils.randomBytes(32))
                const nconfig = [{ weight: 2, address: ownern2a.address, signer: ownern2a }, { weight: 1, address: ownern2b.address }]
                const nsalt = encodeImageHash(2, nconfig)
                await factory.deploy(mainModule.address, nsalt, { gasLimit: 100_000 })
                const nwalletaddr = addressOf(factory.address, mainModule.address, nsalt)
                owner2b = { address: nwalletaddr, signMessage: async (msg) => {
                  const nsubdigest = ethers.utils.solidityPack(
                    ['string', 'uint256', 'address', 'bytes'],
                    ['\x19\x01', networkId, nwalletaddr, msg]
                  )

                  return `${await walletMultiSign([{ weight: 2, owner: ownern2a }, { weight: 1, owner: ownern2b.address }], threshold, nsubdigest)}03`
                } } as any

                // Re-create wallet
                config = [{ weight: 1, address: owner2a.address, signer: owner2a }, { weight: 1, address: owner2b.address, signer: owner2b }, { weight: 1, address: owner2c.address }]
                salt2 = encodeImageHash(threshold, config)
                wallet2addr = addressOf(factory.address, mainModule.address, salt2)
                preSubDigest = ethers.utils.solidityPack(
                  ['string', 'uint256', 'address', 'bytes'],
                  ['\x19\x01', networkId, wallet2addr, digest]
                )

                signature = await walletMultiSign([{ weight: 1, owner: owner2a }, { weight: 1, owner: owner2b }, { weight: 1, owner: owner2c.address }], threshold, preSubDigest)
                break
            }
          })

          it('Should publish signers of a non-deployed wallet', async () => {
            const tx = await signAndExecuteMetaTx(
              wallet,
              owner,
              [
                {
                  delegateCall: false,
                  revertOnError: true,
                  gasLimit: ethers.constants.Zero,
                  target: requireUtils.address,
                  value: ethers.constants.Zero,
                  data: requireUtils.interface.encodeFunctionData('publishInitialSigners',[
                    wallet2addr,
                    digest,
                    3,
                    signature,
                    o.indexed
                  ])
                }
              ],
              networkId
            )
    
            const receipt = await tx.wait()

            const logs = receipt.events!
            
            const owner2aLog = logs.find((l) =>
              (
                l.topics.length === 3 &&
                l.topics[0] === '0x600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f' &&
                l.topics[2] === ethers.utils.defaultAbiCoder.encode(['address'], [owner2a.address])
              )
            )!
    
            expect(owner2aLog).to.not.be.undefined
            expect(owner2aLog.topics[1]).to.equal(ethers.utils.defaultAbiCoder.encode(['address'], [wallet2addr]))
    
            const owner2bLog = logs.find((l) =>
              (
                l.topics.length === 3 &&
                l.topics[0] === '0x600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f' &&
                l.topics[2] === ethers.utils.defaultAbiCoder.encode(['address'], [owner2b.address])
              )
            )!
    
            expect(owner2bLog).to.not.be.undefined
            expect(owner2bLog.topics[1]).to.equal(ethers.utils.defaultAbiCoder.encode(['address'], [wallet2addr]))
    
            const owner2cLog = logs.find((l) =>
              (
                l.topics.length === 3 &&
                l.topics[0] === '0x600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f' &&
                l.topics[2] === ethers.utils.defaultAbiCoder.encode(['address'], [owner2c.address])
              )
            )
    
            expect(owner2cLog).to.be.undefined
    
            const MembersType = `tuple(
              uint256 weight,
              address signer
            )[]`
    
            const walletLog = logs[logs.length - 2]
            expect(walletLog.topics[1]).to.equal(ethers.utils.defaultAbiCoder.encode(['address'], [wallet2addr]))
            expect(walletLog.topics[2]).to.equal(salt2)
            expect(walletLog.data).to.equal(ethers.utils.defaultAbiCoder.encode(
                ['uint256', 'bytes'],
                [threshold, ethers.utils.defaultAbiCoder.encode(
                  [MembersType],
                  [config.sort((a, b) => compareAddr(a.address, b.address)).map((s) => ({ weight: s.weight, signer: s.address }))]
                )]
              )
            )

            expect((await requireUtils.lastSignerUpdate(owner2a.address)).toNumber()).to.equal(o.indexed ? receipt.blockNumber : 0)
            expect((await requireUtils.lastSignerUpdate(owner2b.address)).toNumber()).to.equal(o.indexed ? receipt.blockNumber : 0)
            expect((await requireUtils.lastSignerUpdate(owner2c.address)).toNumber()).to.equal(0)

            expect((await requireUtils.lastWalletUpdate(wallet2addr)).toNumber()).to.equal(o.indexed ? receipt.blockNumber : 0)
            expect((await requireUtils.lastImageHashUpdate(salt2)).toNumber()).to.equal(o.indexed ? receipt.blockNumber : 0)
            expect(await requireUtils.knownImageHashes(wallet2addr)).to.equal(o.indexed ? salt2 : ethers.constants.HashZero)
          })
          it('Should publish signers of a deployed wallet', async () => {
            await factory.deploy(mainModule.address, salt2, { gasLimit: 100_000 })
            const tx = await signAndExecuteMetaTx(
              wallet,
              owner,
              [
                {
                  delegateCall: false,
                  revertOnError: true,
                  gasLimit: ethers.constants.Zero,
                  target: requireUtils.address,
                  value: ethers.constants.Zero,
                  data: requireUtils.interface.encodeFunctionData('publishInitialSigners',[
                    wallet2addr,
                    digest,
                    3,
                    signature,
                    o.indexed
                  ])
                }
              ],
              networkId
            )
    
            const receipt = await tx.wait()

            const logs = receipt.events!
            
            const owner2aLog = logs.find((l) =>
              (
                l.topics.length === 3 &&
                l.topics[0] === '0x600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f' &&
                l.topics[2] === ethers.utils.defaultAbiCoder.encode(['address'], [owner2a.address])
              )
            )!
    
            expect(owner2aLog).to.not.be.undefined
            expect(owner2aLog.topics[1]).to.equal(ethers.utils.defaultAbiCoder.encode(['address'], [wallet2addr]))
    
            const owner2bLog = logs.find((l) =>
              (
                l.topics.length === 3 &&
                l.topics[0] === '0x600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f' &&
                l.topics[2] === ethers.utils.defaultAbiCoder.encode(['address'], [owner2b.address])
              )
            )!
    
            expect(owner2bLog).to.not.be.undefined
            expect(owner2bLog.topics[1]).to.equal(ethers.utils.defaultAbiCoder.encode(['address'], [wallet2addr]))
    
            const owner2cLog = logs.find((l) =>
              (
                l.topics.length === 3 &&
                l.topics[0] === '0x600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f' &&
                l.topics[2] === ethers.utils.defaultAbiCoder.encode(['address'], [owner2c.address])
              )
            )
    
            expect(owner2cLog).to.be.undefined
    
            const MembersType = `tuple(
              uint256 weight,
              address signer
            )[]`
    
            const walletLog = logs[logs.length - 2]
            expect(walletLog.topics[1]).to.equal(ethers.utils.defaultAbiCoder.encode(['address'], [wallet2addr]))
            expect(walletLog.topics[2]).to.equal(salt2)
            expect(walletLog.data).to.equal(ethers.utils.defaultAbiCoder.encode(
                ['uint256', 'bytes'],
                [threshold, ethers.utils.defaultAbiCoder.encode(
                  [MembersType],
                  [config.sort((a, b) => compareAddr(a.address, b.address)).map((s) => ({ weight: s.weight, signer: s.address }))]
                )]
              )
            )

            expect((await requireUtils.lastSignerUpdate(owner2a.address)).toNumber()).to.equal(o.indexed ? receipt.blockNumber : 0)
            expect((await requireUtils.lastSignerUpdate(owner2b.address)).toNumber()).to.equal(o.indexed ? receipt.blockNumber : 0)
            expect((await requireUtils.lastSignerUpdate(owner2c.address)).toNumber()).to.equal(0)

            expect((await requireUtils.lastWalletUpdate(wallet2addr)).toNumber()).to.equal(o.indexed ? receipt.blockNumber : 0)
            expect((await requireUtils.lastImageHashUpdate(salt2)).toNumber()).to.equal(o.indexed ? receipt.blockNumber : 0)
            expect(await requireUtils.knownImageHashes(wallet2addr)).to.equal(o.indexed ? salt2 : ethers.constants.HashZero)
          })
          it('Should fail to publish signers with invalid part', async () => {
            const tx = signAndExecuteMetaTx(
              wallet,
              owner,
              [
                {
                  delegateCall: false,
                  revertOnError: true,
                  gasLimit: ethers.constants.Zero,
                  target: requireUtils.address,
                  value: ethers.constants.Zero,
                  data: requireUtils.interface.encodeFunctionData('publishInitialSigners',[
                    wallet2addr,
                    digest,
                    1,
                    '0x0001ff01ab5801a7d398351b8be11c439e05c5b3259aec9b',
                    o.indexed
                  ])
                }
              ],
              networkId
            )
    
            await expect(tx).to.be.rejectedWith(RevertError("RequireUtils#publishInitialSigners: INVALID_SIGNATURE_FLAG"))
          })
          it('Should fail to publish signers with invalid signers count', async () => {
            const tx = signAndExecuteMetaTx(
              wallet,
              owner,
              [
                {
                  delegateCall: false,
                  revertOnError: true,
                  gasLimit: ethers.constants.Zero,
                  target: requireUtils.address,
                  value: ethers.constants.Zero,
                  data: requireUtils.interface.encodeFunctionData('publishInitialSigners',[
                    wallet2addr,
                    digest,
                    4,
                    signature,
                    o.indexed
                  ])
                }
              ],
              networkId
            )
    
            await expect(tx).to.be.rejectedWith(RevertError("RequireUtils#publishInitialSigners: INVALID_MEMBERS_COUNT"))
          })
          it('Should fail to publish signers of non-deployed wallet with invalid signature', async () => {
            const invalidSignature = await walletMultiSign([{ weight: 1, owner: ethers.Wallet.createRandom() }, { weight: 1, owner: owner2c.address }], threshold, message)
    
            const tx = signAndExecuteMetaTx(
              wallet,
              owner,
              [
                {
                  delegateCall: false,
                  revertOnError: true,
                  gasLimit: ethers.constants.Zero,
                  target: requireUtils.address,
                  value: ethers.constants.Zero,
                  data: requireUtils.interface.encodeFunctionData('publishInitialSigners',[
                    wallet2addr,
                    digest,
                    2,
                    invalidSignature,
                    o.indexed
                  ])
                }
              ],
              networkId
            )
    
            await expect(tx).to.be.rejectedWith(RevertError("RequireUtils#publishInitialSigners: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH"))
          })
          it('Should fail to publish signers of deployed wallet with invalid signature', async () => {
            await factory.deploy(mainModule.address, salt2, { gasLimit: 100_000 })

            const invalidSignature = await walletMultiSign([{ weight: 1, owner: ethers.Wallet.createRandom() }, { weight: 1, owner: owner2c.address }], threshold, message)
    
            const tx = signAndExecuteMetaTx(
              wallet,
              owner,
              [
                {
                  delegateCall: false,
                  revertOnError: true,
                  gasLimit: ethers.constants.Zero,
                  target: requireUtils.address,
                  value: ethers.constants.Zero,
                  data: requireUtils.interface.encodeFunctionData('publishInitialSigners',[
                    wallet2addr,
                    digest,
                    2,
                    invalidSignature,
                    o.indexed
                  ])
                }
              ],
              networkId
            )
    
            await expect(tx).to.be.rejectedWith(RevertError("RequireUtils#publishInitialSigners: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH"))
          })
          it('Should fail to publish signers of updated wallet with invalid signature', async () => {
            await factory.deploy(mainModule.address, salt2, { gasLimit: 100_000 })

            const wallet2 = await MainModule__factory.connect(wallet2addr, signer)

            const newOwnerA = ethers.Wallet.createRandom()
            const newImageHash = encodeImageHash(1, [{ weight: 1, address: newOwnerA.address }])
    
            const newWallet = await MainModuleUpgradable__factory.connect(wallet2.address, signer)
    
            const migrateBundle = [
              {
                delegateCall: false,
                revertOnError: true,
                gasLimit: ethers.constants.Two.pow(18),
                target: newWallet.address,
                value: ethers.constants.Zero,
                data: newWallet.interface.encodeFunctionData('updateImplementation', [moduleUpgradable.address])
              },
              {
                delegateCall: false,
                revertOnError: true,
                gasLimit: ethers.constants.Two.pow(18),
                target: newWallet.address,
                value: ethers.constants.Zero,
                data: newWallet.interface.encodeFunctionData('updateImageHash', [newImageHash])
              }
            ]
    
            const migrateTransaction = [
              {
                delegateCall: false,
                revertOnError: false,
                gasLimit: optimalGasLimit,
                target: newWallet.address,
                value: ethers.constants.Zero,
                data: newWallet.interface.encodeFunctionData('selfExecute', [migrateBundle])
              }
            ]
    
            await multiSignAndExecuteMetaTx(wallet2, config.map((c) => ({ weight: c.weight, owner: c.signer ? c.signer : c.address })), 2, migrateTransaction, networkId)
            signature = await walletMultiSign([{ weight: 1, owner: ethers.Wallet.createRandom() }], 1, message)
    
            const tx = signAndExecuteMetaTx(
              wallet,
              owner,
              [
                {
                  delegateCall: false,
                  revertOnError: true,
                  gasLimit: ethers.constants.Zero,
                  target: requireUtils.address,
                  value: ethers.constants.Zero,
                  data: requireUtils.interface.encodeFunctionData('publishInitialSigners',[
                    wallet2addr,
                    digest,
                    1,
                    signature,
                    o.indexed
                  ])
                }
              ],
              networkId
            )
    
            await expect(tx).to.be.rejectedWith(RevertError("RequireUtils#publishInitialSigners: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH"))
          })
        })
      })
    })
  })

  describe('Update owners', async () => {
    const transaction = {
      delegateCall: false,
      revertOnError: true,
      gasLimit: optimalGasLimit,
      target: ethers.constants.AddressZero,
      value: 0,
      data: []
    }

    let newOwnerA: ethers.Wallet
    let newImageHash

    context('After a migration', async () => {
      beforeEach(async () => {
        newOwnerA = new ethers.Wallet(ethers.utils.randomBytes(32))
        newImageHash = encodeImageHash(1, [{ weight: 1, address: newOwnerA.address }])

        const newWallet = await MainModuleUpgradable__factory.connect(wallet.address, signer)

        const migrateBundle = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Two.pow(18),
            target: wallet.address,
            value: ethers.constants.Zero,
            data: wallet.interface.encodeFunctionData('updateImplementation', [moduleUpgradable.address])
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Two.pow(18),
            target: wallet.address,
            value: ethers.constants.Zero,
            data: newWallet.interface.encodeFunctionData('updateImageHash', [newImageHash])
          }
        ]

        const migrateTransaction = [
          {
            delegateCall: false,
            revertOnError: false,
            gasLimit: optimalGasLimit,
            target: wallet.address,
            value: ethers.constants.Zero,
            data: wallet.interface.encodeFunctionData('selfExecute', [migrateBundle])
          }
        ]

        await signAndExecuteMetaTx(wallet, owner, migrateTransaction, networkId)
        wallet = newWallet as unknown as MainModule
      })
      it('Should implement new upgradable module', async () => {
        const walletUpgradable = wallet as unknown as MainModuleUpgradable
        expect(await walletUpgradable.imageHash()).to.equal(newImageHash)
      })
      it('Should accept new owner signature', async () => {
        await signAndExecuteMetaTx(wallet, newOwnerA, [transaction], networkId)
      })
      it('Should reject old owner signature', async () => {
        const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
      })
      it('Should fail to update to invalid image hash', async () => {
        const walletUpgradable = wallet as unknown as MainModuleUpgradable
        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: walletUpgradable.interface.encodeFunctionData('updateImageHash', [ethers.constants.HashZero])
        }
        const tx = signAndExecuteMetaTx(wallet, newOwnerA, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleAuthUpgradable#updateImageHash INVALID_IMAGE_HASH')
      })
      it('Should fail to change image hash from non-self address', async () => {
        const walletUpgradable = wallet as unknown as MainModuleUpgradable
        const tx = walletUpgradable.updateImageHash(ethers.utils.hexlify(ethers.utils.randomBytes(32)), { from: accounts[0] })
        await expect(tx).to.be.rejectedWith('ModuleSelfAuth#onlySelf: NOT_AUTHORIZED')
      })
      it('Should use image hash storage key', async () => {
        const storageKey = moduleStorageKey('org.arcadeum.module.auth.upgradable.image.hash')
        const storageValue = await web3.eth.getStorageAt(wallet.address, storageKey)
        expect(ethers.utils.defaultAbiCoder.encode(['bytes32'], [storageValue])).to.equal(newImageHash)
      })
      it('Should fail to execute transactions on moduleUpgradable implementation', async () => {
        const tx = moduleUpgradable.execute([transaction], 0, '0x0000')
        await expect(tx).to.be.rejectedWith(RevertError('ModuleCalls#execute: INVALID_SIGNATURE'))
      })
      it('Should update wallet and publish configuration', async () => {
        const threshold = 2
        const newOwnerB = new ethers.Wallet(ethers.utils.randomBytes(32))
        const newOwnerC = new ethers.Wallet(ethers.utils.randomBytes(32))

        const members = [
          { weight: 1, signer: newOwnerB.address },
          { weight: 1, signer: newOwnerC.address }
        ]

        const newImageHash = encodeImageHash(threshold, [
          { weight: 1, address: newOwnerB.address },
          { weight: 1, address: newOwnerC.address }
        ])

        const walletUpgradable = wallet as unknown as MainModuleUpgradable
        
        const migrateTransactions = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: wallet.address,
            value: ethers.constants.Zero,
            data: walletUpgradable.interface.encodeFunctionData('updateImageHash', [newImageHash])
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Zero,
            target: requireUtils.address,
            value: ethers.constants.Zero,
            data: requireUtils.interface.encodeFunctionData('publishConfig', [
              wallet.address,
              threshold,
              members.sort((a, b) => compareAddr(a.signer, b.signer)),
              false
            ])
          }
        ]

        await signAndExecuteMetaTx(wallet, newOwnerA, migrateTransactions, networkId)
      })
      it('Should fail to update wallet and publish wrong configuration', async () => {
        const threshold = 2
        const newOwnerB = new ethers.Wallet(ethers.utils.randomBytes(32))
        const newOwnerC = new ethers.Wallet(ethers.utils.randomBytes(32))

        const members = [
          { weight: 1, signer: newOwnerB.address },
          { weight: 1, signer: newOwnerC.address }
        ]

        const newImageHash = encodeImageHash(threshold, [
          { weight: 1, address: newOwnerB.address },
          { weight: 2, address: newOwnerC.address }
        ])

        const walletUpgradable = wallet as unknown as MainModuleUpgradable

        const migrateTransactions = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: wallet.address,
            value: ethers.constants.Zero,
            data: walletUpgradable.interface.encodeFunctionData('updateImageHash', [newImageHash])
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Zero,
            target: requireUtils.address,
            value: ethers.constants.Zero,
            data: requireUtils.interface.encodeFunctionData('publishConfig', [
              wallet.address,
              threshold,
              members.sort((a, b) => compareAddr(a.signer, b.signer)),
              false
            ])
          }
        ]

        const tx = signAndExecuteMetaTx(wallet, newOwnerA, migrateTransactions, networkId)
        await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#publishConfig: UNEXPECTED_IMAGE_HASH'))
      })
      context('After updating the image hash', () => {
        let threshold = 2
        let newOwnerB
        let newOwnerC

        beforeEach(async () => {
          newOwnerB = new ethers.Wallet(ethers.utils.randomBytes(32))
          newOwnerC = new ethers.Wallet(ethers.utils.randomBytes(32))
          newImageHash = encodeImageHash(threshold, [
            { weight: 1, address: newOwnerB.address },
            { weight: 1, address: newOwnerC.address }
          ])
          const migrateTransactions = [
            {
              delegateCall: false,
              revertOnError: true,
              gasLimit: optimalGasLimit,
              target: wallet.address,
              value: ethers.constants.Zero,
              data: (wallet as unknown as MainModuleUpgradable).interface.encodeFunctionData('updateImageHash', [newImageHash])
            }
          ]

          await signAndExecuteMetaTx(wallet, newOwnerA, migrateTransactions, networkId)
        })
        it('Should have updated the image hash', async () => {
          expect(await (wallet as unknown as MainModuleUpgradable).imageHash()).to.equal(newImageHash)
        })
        it('Should accept new owners signatures', async () => {
          const accounts = [
            {
              weight: 1,
              owner: newOwnerB
            },
            {
              weight: 1,
              owner: newOwnerC
            }
          ]
          await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
        })
        it('Should reject old owner signatures', async () => {
          const tx = signAndExecuteMetaTx(wallet, newOwnerA, [transaction], networkId)
          await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
        })
        it('Should use image hash storage key', async () => {
          const storageKey = moduleStorageKey('org.arcadeum.module.auth.upgradable.image.hash')
          const storageValue = await web3.eth.getStorageAt(wallet.address, storageKey)
          expect(ethers.utils.defaultAbiCoder.encode(['bytes32'], [storageValue])).to.equal(newImageHash)
        })
      })
    })
  })

  describe('Multisignature', async () => {
    const transaction = {
      delegateCall: false,
      revertOnError: true,
      gasLimit: optimalGasLimit,
      target: ethers.constants.AddressZero,
      value: 0,
      data: []
    }

    const modes = [{
      name: "Forced dynamic signature encoding",
      force: true,
    }, {
      name: "Default signature encoding",
      force: false,
    }]

    modes.map((mode) => {
      context(mode.name, () => {
        context('With 1/2 wallet', () => {
          let owner1: ethers.Wallet
          let owner2: ethers.Wallet
          let ownerweight = 1
          let threshold = 1
    
          beforeEach(async () => {
            owner1 = new ethers.Wallet(ethers.utils.randomBytes(32))
            owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
    
            const salt = encodeImageHash(threshold, [
              {
                weight: ownerweight,
                address: owner1.address
              },
              {
                weight: ownerweight,
                address: owner2.address
              }
            ])
    
            await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
            wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)
          })
          it('Should accept signed message by first owner', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1
              },
              {
                weight: ownerweight,
                owner: owner2.address
              }
            ]
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should accept signed message by second owner', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1.address
              },
              {
                weight: ownerweight,
                owner: owner2
              }
            ]
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should accept signed message by both owners', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1
              },
              {
                weight: ownerweight,
                owner: owner2
              }
            ]
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should reject message without signatures', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1.address
              },
              {
                weight: ownerweight,
                owner: owner2.address
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message signed by non-owner', async () => {
            const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
    
            const accounts = [
              {
                weight: ownerweight,
                owner: impostor
              },
              {
                weight: ownerweight,
                owner: owner2.address
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject signature of invalid length', async () => {
            const data = encodeMetaTransactionsData(wallet.address, [transaction], networkId, await nextNonce(wallet))
            const eoasignature = ethers.utils.arrayify(await ethSign(owner2, data, false))

            const accounts = [
              {
                weight: ownerweight,
                owner: owner1.address
              },
              {
                weight: ownerweight,
                owner: owner2.address,
                signature: [ ...eoasignature.slice(0, -1), 75, 2]
              }
            ]

            const signature = await multiSignMetaTransactions(wallet, accounts, threshold, [transaction], networkId, await nextNonce(wallet), mode.force)
            const tx = wallet.execute([transaction], await nextNonce(wallet), signature)
            await expect(tx).to.be.rejectedWith(RevertError("SignatureValidator#recoverSigner: invalid signature length"))
          })
        })
        context('With 2/2 wallet', () => {
          let owner1
          let owner2
          let ownerweight = 1
          let threshold = 2
    
          beforeEach(async () => {
            owner1 = new ethers.Wallet(ethers.utils.randomBytes(32))
            owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
    
            const salt = encodeImageHash(threshold, [
              {
                weight: ownerweight,
                address: owner1.address
              },
              {
                weight: ownerweight,
                address: owner2.address
              }
            ])
    
            await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
            wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)
          })
          it('Should accept signed message by both owners', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1
              },
              {
                weight: ownerweight,
                owner: owner2
              }
            ]
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should reject message without signatures', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1.address
              },
              {
                weight: ownerweight,
                owner: owner2.address
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message signed only by first owner', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1
              },
              {
                weight: ownerweight,
                owner: owner2.address
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message signed only by second owner', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1
              },
              {
                weight: ownerweight,
                owner: owner2.address
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message signed by non-owner', async () => {
            const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
    
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1
              },
              {
                weight: ownerweight,
                owner: impostor
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
        })
        context('With 2/3 wallet', () => {
          let owner1
          let owner2
          let owner3
    
          let ownerweight = 1
          let threshold = 2
    
          beforeEach(async () => {
            owner1 = new ethers.Wallet(ethers.utils.randomBytes(32))
            owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
            owner3 = new ethers.Wallet(ethers.utils.randomBytes(32))
    
            const salt = encodeImageHash(threshold, [
              {
                weight: ownerweight,
                address: owner1.address
              },
              {
                weight: ownerweight,
                address: owner2.address
              },
              {
                weight: ownerweight,
                address: owner3.address
              }
            ])
    
            await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
            wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)
          })
    
          it('Should accept signed message by first and second owner', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1
              },
              {
                weight: ownerweight,
                owner: owner2
              },
              {
                weight: ownerweight,
                owner: owner3.address
              }
            ]
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should accept signed message by first and last owner', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1
              },
              {
                weight: ownerweight,
                owner: owner2.address
              },
              {
                weight: ownerweight,
                owner: owner3
              }
            ]
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should accept signed message by second and last owner', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1.address
              },
              {
                weight: ownerweight,
                owner: owner2
              },
              {
                weight: ownerweight,
                owner: owner3
              }
            ]
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should accept signed message by all owners', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1
              },
              {
                weight: ownerweight,
                owner: owner2
              },
              {
                weight: ownerweight,
                owner: owner3
              }
            ]
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should reject message signed only by first owner', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1
              },
              {
                weight: ownerweight,
                owner: owner2.address
              },
              {
                weight: ownerweight,
                owner: owner3.address
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message signed only by second owner', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1.address
              },
              {
                weight: ownerweight,
                owner: owner2
              },
              {
                weight: ownerweight,
                owner: owner3.address
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message signed only by last owner', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1.address
              },
              {
                weight: ownerweight,
                owner: owner2.address
              },
              {
                weight: ownerweight,
                owner: owner3
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message not signed', async () => {
            const accounts = [
              {
                weight: ownerweight,
                owner: owner1.address
              },
              {
                weight: ownerweight,
                owner: owner2.address
              },
              {
                weight: ownerweight,
                owner: owner3.address
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message signed by non-owner', async () => {
            const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
    
            const accounts = [
              {
                weight: ownerweight,
                owner: impostor
              },
              {
                weight: ownerweight,
                owner: owner2
              },
              {
                weight: ownerweight,
                owner: owner3.address
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message if the image lacks an owner', async () => {
            const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
    
            const accounts = [
              {
                weight: ownerweight,
                owner: impostor
              },
              {
                weight: ownerweight,
                owner: owner2
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
        })
    
        context('With 255/255 wallet', () => {
          let owners: ethers.Wallet[]
          let weight = 1
          let threshold = 255
  
          beforeEach(async () => {
            owners = Array(255)
              .fill(0)
              .map(() => new ethers.Wallet(ethers.utils.randomBytes(32)))
  
            const salt = encodeImageHash(
              threshold,
              owners.map(owner => ({
                weight: weight,
                address: owner.address
              }))
            )
  
            await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
            wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)
          })
  
          it('Should accept message signed by all owners', async () => {
            const accounts = owners.map(owner => ({
              weight: weight,
              owner: owner
            }))
  
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should reject message signed by non-owner', async () => {
            const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
            const accounts = [
              ...owners.slice(1).map(owner => ({
                weight: weight,
                owner: owner
              })),
              {
                weight: weight,
                owner: impostor
              }
            ]
  
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message missing a signature', async () => {
            const accounts = owners.slice(1).map(owner => ({
              weight: weight,
              owner: owner
            }))
  
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
        })
    
        context('With weighted owners', () => {
          let owners: ethers.Wallet[]
          let weights: BigNumberish[]
          let threshold = 4
    
          beforeEach(async () => {
            owners = Array(5)
              .fill(0)
              .map(() => new ethers.Wallet(ethers.utils.randomBytes(32)))
            weights = [3, 3, 1, 1, 1]
    
            const salt = encodeImageHash(
              threshold,
              owners.map((owner, i) => ({
                weight: weights[i],
                address: owner.address
              }))
            )
    
            await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
            wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)
          })
    
          it('Should accept signed message with (3+1)/4 weight', async () => {
            const signers = [0, 3]
    
            const accounts = owners.map((owner, i) => ({
              weight: weights[i],
              owner: signers.includes(i) ? owner : owner.address
            }))
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should accept signed message with (3+3)/4 weight', async () => {
            const signers = [0, 1]
    
            const accounts = owners.map((owner, i) => ({
              weight: weights[i],
              owner: signers.includes(i) ? owner : owner.address
            }))
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should accept signed message with (3+3+1+1)/4 weight', async () => {
            const signers = [0, 1, 2, 3]
    
            const accounts = owners.map((owner, i) => ({
              weight: weights[i],
              owner: signers.includes(i) ? owner : owner.address
            }))
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should accept signed message with (3+3+1+1+1)/4 weight', async () => {
            const signers = [0, 1, 2, 3, 4]
    
            const accounts = owners.map((owner, i) => ({
              weight: weights[i],
              owner: signers.includes(i) ? owner : owner.address
            }))
    
            await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
          })
          it('Should reject signed message with (1)/4 weight', async () => {
            const signers = [3]
    
            const accounts = owners.map((owner, i) => ({
              weight: weights[i],
              owner: signers.includes(i) ? owner : owner.address
            }))
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject signed message with (1+1)/4 weight', async () => {
            const signers = [2, 3]
    
            const accounts = owners.map((owner, i) => ({
              weight: weights[i],
              owner: signers.includes(i) ? owner : owner.address
            }))
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject signed message with (1+1+1)/4 weight', async () => {
            const signers = [2, 3, 4]
    
            const accounts = owners.map((owner, i) => ({
              weight: weights[i],
              owner: signers.includes(i) ? owner : owner.address
            }))
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject signed message with (3)/4 weight', async () => {
            const signers = [0]
    
            const accounts = owners.map((owner, i) => ({
              weight: weights[i],
              owner: signers.includes(i) ? owner : owner.address
            }))
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject signed message with (0)/4 weight', async () => {
            const accounts = owners.map((owner, i) => ({
              weight: weights[i],
              owner: owner.address
            }))
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
          it('Should reject message signed by non-owner', async () => {
            const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
    
            const signers = [0, 1]
    
            const accounts = [
              ...owners.map((owner, i) => ({
                weight: weights[i],
                owner: signers.includes(i) ? owner : owner.address
              })),
              {
                weight: 4,
                owner: impostor
              }
            ]
    
            const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, mode.force)
            await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
          })
        })

        context('Reject invalid signatures', () => {
          it("Should reject invalid signature type", async () => {
            const signature = await multiSignMetaTransactions(wallet, [{ weight: 1, owner: owner }], 1, [transaction], networkId, 0, mode.force)
            const invalidSignature = signature.slice(0, -2) + 'ff'
            const tx = wallet.execute([transaction], 0, invalidSignature)
            const revertError = mode.force ? "SignatureValidator#isValidSignature: UNSUPPORTED_SIGNATURE_TYPE" : "SignatureValidator#recoverSigner: UNSUPPORTED_SIGNATURE_TYPE"
            await expect(tx).to.be.rejectedWith(RevertError(revertError))
          })
          it("Should reject invalid s value", async () => {
            const sig = await multiSignMetaTransactions(wallet, [{ weight: 1, owner: owner }], 1, [transaction], networkId, 0, mode.force)
            const prefix = mode.force ? 118 : 74
            const invalidSignature = sig.slice(0, prefix) + "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a1" + sig.slice(prefix + 64)
            const tx = wallet.execute([transaction], 0, invalidSignature)
            await expect(tx).to.be.rejectedWith(RevertError("SignatureValidator#recoverSigner: invalid signature 's' value"))
          })
          it("Should reject invalid v value", async () => {
            const sig = await multiSignMetaTransactions(wallet, [{ weight: 1, owner: owner }], 1, [transaction], networkId, 0, mode.force)
            const prefix = mode.force ? 182 : 138
            const invalidSignature = sig.slice(0, prefix) + "1a" + sig.slice(prefix + 2)
            const tx = wallet.execute([transaction], 0, invalidSignature)
            await expect(tx).to.be.rejectedWith(RevertError("SignatureValidator#recoverSigner: invalid signature 'v' value"))
          })
        })
      })
    })
  })

  describe('Gas limit', () => {
    let gasBurner: GasBurnerMock

    before(async () => {
      gasBurner = await (new GasBurnerMock__factory()).connect(signer).deploy()
    })

    it('Should forward the defined amount of gas', async () => {
      const gas = 10000

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: gas,
        target: gasBurner.address,
        value: ethers.constants.Zero,
        data: gasBurner.interface.encodeFunctionData('burnGas', [0])
      }

      const tx = await (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)).wait()
      const reported = web3.utils.toBN(tx.logs.slice(-2)[0].data)
      expect(reported).to.be.lt.BN(gas)
    })
    it('Should forward different amounts of gas', async () => {
      const gasA = 10000
      const gasB = 350000

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: gasA,
          target: gasBurner.address,
          value: ethers.constants.Zero,
          data: gasBurner.interface.encodeFunctionData('burnGas', [8000])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: gasB,
          target: gasBurner.address,
          value: ethers.constants.Zero,
          data: gasBurner.interface.encodeFunctionData('burnGas', [340000])
        }
      ]

      const tx = await (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)).wait()

      const reportedB = web3.utils.toBN(tx.logs.slice(-2)[0].data)
      const reportedA = web3.utils.toBN(tx.logs.slice(-4)[0].data)

      expect(reportedA).to.be.lt.BN(gasA)
      expect(reportedB).to.be.lt.BN(gasB)
      expect(reportedB).to.be.gt.BN(gasA)
    })
    it('Should fail if forwarded call runs out of gas', async () => {
      const gas = 10000

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: gas,
        target: gasBurner.address,
        value: ethers.constants.Zero,
        data: gasBurner.interface.encodeFunctionData('burnGas', [11000])
      }

      const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      expect(tx).to.be.rejected
    })
    it('Should fail without reverting if optional call runs out of gas', async () => {
      const gas = 10000

      const transaction = {
        delegateCall: false,
        revertOnError: false,
        gasLimit: gas,
        target: gasBurner.address,
        value: ethers.constants.Zero,
        data: gasBurner.interface.encodeFunctionData('burnGas', [200_000])
      }

      const tx = await (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)).wait()
      const log = tx.events?.pop()!
      expect(log.event).to.be.equal('TxFailed')
    })
    it('Should continue execution if optional call runs out of gas', async () => {
      const gas = 10000

      const callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const valA = 9512358833
      const valB = web3.utils.randomHex(1600)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: gas,
          target: gasBurner.address,
          value: ethers.constants.Zero,
          data: gasBurner.interface.encodeFunctionData('burnGas', [200000])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]

      const tx = await (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)).wait()
      const log = tx.events?.slice(-2)[0]!
      expect(log.event).to.be.equal('TxFailed')
      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should fail if transaction is executed with not enough gas', async () => {
      const gas = 1000000

      const transaction = {
        delegateCall: false,
        revertOnError: false,
        gasLimit: gas,
        target: gasBurner.address,
        value: ethers.constants.Zero,
        data: gasBurner.interface.encodeFunctionData('burnGas', [0])
      }

      const signed = await multiSignMetaTransactions(wallet, [{ weight: 1, owner: owner }], 1, [transaction], networkId, 0)

      const tx = wallet.execute([transaction], 0, signed, { gasLimit: 250_000 })
      await expect(tx).to.be.rejectedWith(RevertError('ModuleCalls#_execute: NOT_ENOUGH_GAS'))
    })
  })

  describe('Create contracts', () => {
    it('Should create a contract', async () => {
      const deployCode = CallReceiverMockArtifact.bytecode

      const transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('createContract', [deployCode])
        }
      ]

      const tx = await (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)).wait()
      const log = tx.events?.find(l => l.event === 'CreatedContract')!

      expect(log.event).to.equal('CreatedContract')

      const deployed = await CallReceiverMock__factory.connect(log.args?._contract, signer)
      await deployed.testCall(12345, '0x552299')

      expect((await deployed.lastValA()).toNumber()).to.eq.BN(12345)
      expect(await deployed.lastValB()).to.equal('0x552299')
    })
    it('Should create a contract with value', async () => {
      const deployCode = CallReceiverMockArtifact.bytecode

      await signer.sendTransaction({
        to: wallet.address,
        value: 100
      })

      const transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: 99,
          data: wallet.interface.encodeFunctionData('createContract', [deployCode])
        }
      ]

      const tx = await (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)).wait()
      const log = tx.events?.find(l => l.event === 'CreatedContract')!

      expect(await web3.eth.getBalance(log.args?._contract)).to.eq.BN(99)
    })
    it('Should fail to create a contract from non-self', async () => {
      const deployCode = CallReceiverMockArtifact.bytecode

      const tx = wallet.createContract(deployCode)
      await expect(tx).to.be.rejectedWith(RevertError('ModuleSelfAuth#onlySelf: NOT_AUTHORIZED'))
    })
  })

  describe('Transaction events', () => {
    const transaction = {
      delegateCall: false,
      revertOnError: true,
      gasLimit: optimalGasLimit,
      target: ethers.constants.AddressZero,
      value: ethers.constants.Zero,
      data: []
    }

    it('Should emit TxExecuted event', async () => {
      const tx = await (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)).wait()
      const log = tx.logs[1]
      const txHash = ethers.utils.keccak256(encodeMetaTransactionsData(wallet.address, [transaction], networkId, 0))

      expect(log.topics.length).to.equal(0)
      expect(log.data).to.be.equal(txHash)
    })

    it('Should emit multiple TxExecuted events', async () => {
      const tx = await (await signAndExecuteMetaTx(wallet, owner, [transaction, transaction], networkId)).wait()
      const log1 = tx.events![1]
      const log2 = tx.events![2]

      const txHash = ethers.utils.keccak256(encodeMetaTransactionsData(wallet.address, [transaction, transaction], networkId, 0))

      expect(log1.topics.length).to.equal(0)
      expect(log1.data).to.be.equal(txHash)

      expect(log2.topics.length).to.equal(0)
      expect(log2.data).to.be.equal(txHash)
    })
  })

  describe('Internal bundles', () => {
    it('Should execute internal bundle', async () => {
      const callReceiver1 = await (new CallReceiverMock__factory()).connect(signer).deploy()
      const callReceiver2 = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const expected1 = await web3.utils.randomHex(552)
      const expected2 = await web3.utils.randomHex(24)

      const bundle = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit.div(ethers.constants.Two),
          target: callReceiver1.address,
          value: ethers.constants.Zero,
          data: callReceiver1.interface.encodeFunctionData('testCall', [11, expected1])
        },
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit.div(ethers.constants.Two),
          target: callReceiver2.address,
          value: ethers.constants.Zero,
          data: callReceiver1.interface.encodeFunctionData('testCall', [12, expected2])
        }
      ]

      const transaction = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('selfExecute', [bundle])
        }
      ]

      await signAndExecuteMetaTx(wallet, owner, transaction, networkId)

      expect((await callReceiver1.lastValA()).toNumber()).to.eq.BN(11)
      expect((await callReceiver2.lastValA()).toNumber()).to.eq.BN(12)

      expect((await callReceiver1.lastValB()).toString()).to.equal(expected1)
      expect((await callReceiver2.lastValB()).toString()).to.equal(expected2)
    })
    it('Should execute multiple internal bundles', async () => {
      const data = [
        [
          { i: 0, a: 142, b: 412 },
          { i: 1, a: 123, b: 2 }
        ],
        [
          { i: 2, a: 142, b: 2 },
          { i: 3, a: 642, b: 33 },
          { i: 4, a: 122, b: 12 },
          { i: 5, a: 611, b: 53 }
        ],
        [{ i: 6, a: 2, b: 1 }],
        []
      ]

      const contracts = await Promise.all(data.flat().map(async () => await (new CallReceiverMock__factory()).connect(signer).deploy()))
      const expectedb = await Promise.all(data.flat().map(d => web3.utils.randomHex(d.b)))

      const bundles = data.map(bundle => {
        return bundle.map(obj => ({
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit.div(ethers.constants.Two),
          value: ethers.constants.Zero,
          target: contracts[obj.i].address,
          data: contracts[obj.i].interface.encodeFunctionData('testCall', [obj.a, expectedb[obj.i]])
        }))
      })

      const transactions = bundles.map(bundle => ({
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.interface.encodeFunctionData('selfExecute', [bundle])
      }))

      await signAndExecuteMetaTx(wallet, owner, transactions, networkId)

      const lastValsA = await Promise.all(contracts.map((c: CallReceiverMock) => c.lastValA()))
      const lastValsB = await Promise.all(contracts.map((c: CallReceiverMock) => c.lastValB()))

      lastValsA.forEach((val, i) => expect(val.toNumber()).to.eq.BN(data.flat()[i].a))
      lastValsB.forEach((val, i) => expect(val).to.equal(expectedb[i]))
    })
    it('Should execute nested internal bundles', async () => {
      const callReceiver1 = await (new CallReceiverMock__factory()).connect(signer).deploy()
      const callReceiver2 = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const expected1 = await web3.utils.randomHex(552)
      const expected2 = await web3.utils.randomHex(24)

      const bundle = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit.div(4),
          target: callReceiver1.address,
          value: ethers.constants.Zero,
          data: callReceiver1.interface.encodeFunctionData('testCall', [11, expected1])
        },
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit.div(4),
          target: callReceiver2.address,
          value: ethers.constants.Zero,
          data: callReceiver1.interface.encodeFunctionData('testCall', [12, expected2])
        }
      ]

      const nestedBundle = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit.div(2),
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('selfExecute', [bundle])
        }
      ]

      const transaction = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('selfExecute', [nestedBundle])
        }
      ]

      await signAndExecuteMetaTx(wallet, owner, transaction, networkId)

      expect((await callReceiver1.lastValA()).toNumber()).to.eq.BN(11)
      expect((await callReceiver2.lastValA()).toNumber()).to.eq.BN(12)

      expect(await callReceiver1.lastValB()).to.equal(expected1)
      expect(await callReceiver2.lastValB()).to.equal(expected2)
    })
    it('Should revert bundle without reverting transaction', async () => {
      const callReceiver1 = await (new CallReceiverMock__factory()).connect(signer).deploy()
      const callReceiver2 = await (new CallReceiverMock__factory()).connect(signer).deploy()
      const callReceiver3 = await (new CallReceiverMock__factory()).connect(signer).deploy()

      const expected1 = await web3.utils.randomHex(552)
      const expected2 = await web3.utils.randomHex(24)
      const expected3 = await web3.utils.randomHex(11)

      const bundle = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.BigNumber.from(100000),
          target: callReceiver1.address,
          value: ethers.constants.Zero,
          data: callReceiver1.interface.encodeFunctionData('testCall', [11, expected1])
        },
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: ethers.BigNumber.from(100000),
          target: callReceiver2.address,
          value: ethers.constants.Zero,
          data: callReceiver2.interface.encodeFunctionData('testCall', [12, expected2])
        },
        {
          // This transaction will revert
          // because Factory has no fallback
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.BigNumber.from(100000),
          target: factory.address,
          value: ethers.constants.Zero,
          data: callReceiver1.interface.encodeFunctionData('testCall', [12, expected2])
        }
      ]

      const transaction = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('selfExecute', [bundle])
        },
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: callReceiver3.address,
          value: ethers.constants.Zero,
          data: callReceiver3.interface.encodeFunctionData('testCall', [51, expected3])
        }
      ]

      const tx = await signAndExecuteMetaTx(wallet, owner, transaction, networkId)

      expect((await callReceiver1.lastValA()).toNumber()).to.eq.BN(0)
      expect((await callReceiver2.lastValA()).toNumber()).to.eq.BN(0)
      expect((await callReceiver3.lastValA()).toNumber()).to.eq.BN(51)

      expect(await callReceiver1.lastValB()).to.equal('0x')
      expect(await callReceiver2.lastValB()).to.equal('0x')
      expect(await callReceiver3.lastValB()).to.equal(expected3)
    })
  })
})


// 0x000102010b1f05b9dd385e2683500bdfec03b53b0d9acb8f004700010001d4c175bfe46abb1138ad97ec9560aae4b745f0b2957986b3367dbaa3486e40497096518c964bad007597f625e2e978d1d6f5096ed2783cb8ceeb828088e81a811b020303
// 0x000102010b1f05b9dd385e2683500bdfec03b53b0d9acb8f004700010001d4c175bfe46abb1138ad97ec9560aae4b745f0b2957986b3367dbaa3486e40497096518c964bad007597f625e2e978d1d6f5096ed2783cb8ceeb828088e81a811b0203
//                                                       00010001d4c175bfe46abb1138ad97ec9560aae4b745f0b2957986b3367dbaa3486e40497096518c964bad007597f625e2e978d1d6f5096ed2783cb8ceeb828088e81a811b02
//                                                               d4c175bfe46abb1138ad97ec9560aae4b745f0b2957986b3367dbaa3486e40497096518c964bad007597f625e2e978d1d6f5096ed2783cb8ceeb828088e81a811b02

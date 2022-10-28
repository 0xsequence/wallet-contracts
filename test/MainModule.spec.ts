import * as ethers from 'ethers'
import { ethers as hethers } from 'hardhat'

import { bytes32toAddress, CHAIN_ID, expect, expectToBeRejected, randomHex } from './utils'

import { CallReceiverMock, ContractType, deploySequenceContext, ModuleMock, SequenceContext, DelegateCallMock, HookMock, HookCallerMock, GasBurnerMock } from './utils/contracts'
import { Imposter } from './utils/imposter'
import { applyTxDefaults, computeStorageKey, digestOf, encodeNonce, leavesOf, legacyTopology, merkleTopology, optimize2SignersTopology, printTopology, SignatureType, SimplifiedWalletConfig, subDigestOf, toSimplifiedConfig, WalletConfig } from './utils/sequence'
import { SequenceWallet, StaticSigner } from './utils/wallet'

contract('MainModule', (accounts: string[]) => {
  let context: SequenceContext
  let callReceiver: ContractType<typeof CallReceiverMock>

  let wallet: SequenceWallet

  before(async () => {
    context = await deploySequenceContext()
  })

  beforeEach(async () => {
    callReceiver = await CallReceiverMock.deploy()

    wallet = SequenceWallet.basicWallet(context)
    await wallet.deploy()
  })

  describe('Nested signatures', () => {
    it('Should accept simple nested signed ERC1271 message', async () => {
      // Wallet A
      const wallet_a = SequenceWallet.basicWallet(context)
      await wallet_a.deploy()

      wallet = SequenceWallet.detailedWallet(context, { threshold: 1, signers: [wallet_a] })
      await wallet.deploy()

      const message = randomHex(32)
      const signature = await wallet.signMessage(message)

      const hookCaller = await HookCallerMock.deploy()
      await hookCaller.callERC1271isValidSignatureData(wallet.address, message, signature)
    })

    it('Should accept simple nested signer', async () => {
      // Wallet A
      const wallet_a = SequenceWallet.basicWallet(context)
      await wallet_a.deploy()

      wallet = SequenceWallet.detailedWallet(context, { threshold: 1, signers: [wallet_a] })
      await wallet.deploy()

      const valA = 4123222
      const valB = randomHex(99)

      const transaction = {
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      await wallet.sendTransactions([transaction])

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })

    it('Should accept two nested signers', async () => {
      // WalletA
      const wallet_a = SequenceWallet.basicWallet(context)
      await wallet_a.deploy()

      // WalletB
      const wallet_b = SequenceWallet.basicWallet(context)
      await wallet_b.deploy()

      // Top level wallet
      wallet = SequenceWallet.detailedWallet(context, { threshold: 1, signers: [wallet_a, wallet_b] })
      await wallet.deploy()

      const valA = 4123222
      const valB = randomHex(99)

      const transaction = {
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      await wallet.sendTransactions([transaction])

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })

    it('Should accept mixed nested and eoa signers', async () => {
      // WalletA
      const wallet_a = SequenceWallet.basicWallet(context)
      await wallet_a.deploy()

      // EOA (B)
      const singer_b = ethers.Wallet.createRandom()

      // Top level wallet
      wallet = SequenceWallet.detailedWallet(context, { threshold: 1, signers: [wallet_a, singer_b] })
      await wallet.deploy()

      const valA = 4123222
      const valB = randomHex(99)

      const transaction = {
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      await wallet.sendTransactions([transaction])

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })

    ;([{
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
    }]).map((c) => {
      it(`Should handle ${c.name}`, async () => {
        const genWallet = async (depth: number, numChilds: number | undefined, max: number): Promise<SequenceWallet | StaticSigner> => {
          if (depth === max) {
            return ethers.Wallet.createRandom()
          }

          const nchilds = numChilds || (Math.floor(Math.random() * 5) + 1)
          const childs = await Promise.all(new Array(nchilds).fill(0).map(async () => genWallet(depth + 1, nchilds, max)))
          const wallet = SequenceWallet.detailedWallet(context, { threshold: childs.length, signers: childs })
          await wallet.deploy()

          return wallet
        }

        wallet = await genWallet(0, c.childs, c.depth) as SequenceWallet

        const valA = 5423
        const valB = randomHex(120)
  
        const transaction = {
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }

        await wallet.sendTransactions([transaction], undefined, { gasLimit: 50000000 })

        expect(await callReceiver.lastValA()).to.equal(valA)
        expect(await callReceiver.lastValB()).to.equal(valB)
      })
    })

    it('Should reject invalid nested signature', async () => {
      const wallet_a = SequenceWallet.basicWallet(context)
      await wallet_a.deploy()

      let wallet_b = SequenceWallet.basicWallet(context)
      await wallet_b.deploy()

      wallet = SequenceWallet.detailedWallet(context, { threshold: 1, signers: [wallet_a, wallet_b] })
      await wallet.deploy()

      const imposter = Imposter.random(wallet_b.signers[0] as StaticSigner)
      wallet_b = wallet_b.useSigners([imposter])
      wallet = wallet.useSigners([wallet_a, wallet_b])

      const transaction = {
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [5423, randomHex(32)])
      }

      const subDigest = subDigestOf(wallet.address, digestOf([transaction], await wallet.getNonce()))
      const badNestedSignature = await wallet_b.signDigest(subDigest).then((s) => s + '03')

      const tx = wallet.sendTransactions([transaction])
      await expectToBeRejected(tx, `InvalidNestedSignature("${subDigest}", "${wallet_b.address}", "${badNestedSignature}")`)
    })

    it('Should enforce threshold on nested sigantures', async () => {
      const wallet_a = SequenceWallet.basicWallet(context)
      await wallet_a.deploy()

      let wallet_b = SequenceWallet.basicWallet(context)
      await wallet_b.deploy()

      wallet = SequenceWallet.detailedWallet(context, { threshold: 3, signers: [wallet_a, wallet_b] })
      await wallet.deploy()

      const signauture = await wallet.signTransactions([{}])
      const subDigest = subDigestOf(wallet.address, digestOf([{}], await wallet.getNonce()))

      const tx = wallet.relayTransactions([{}], signauture)
      await expect(tx).to.be.rejected
    })

    it('Should read weight of nested wallets', async () => {
      const wallet_a = SequenceWallet.basicWallet(context)
      await wallet_a.deploy()

      const wallet_b = SequenceWallet.basicWallet(context)
      await wallet_b.deploy()

      const wallet_c = SequenceWallet.basicWallet(context)
      await wallet_c.deploy()

      wallet = SequenceWallet.detailedWallet(context, { threshold: 2, signers: [wallet_a, wallet_b, { weight: 2, value: wallet_c }] })
      await wallet.deploy()

      const valA = 5423
      const valB = randomHex(120)

      const transaction = {
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      await wallet.useSigners(wallet_c).sendTransactions([transaction])

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
  })

  describe('Authentication', () => {
    it('Should accept initial owner signature', async () => {
      await wallet.sendTransactions([{}])
    })

    it('Should reject non-owner signature', async () => {
      const tx = wallet.useSigners(Imposter.random(wallet.signers[0] as StaticSigner)).sendTransactions([{}])
      await expect(tx).to.be.rejected
    })

    describe('Network ID', () => {
      it('Should reject a transaction of another network id', async () => {
        wallet = wallet.useChainId(CHAIN_ID() + 1)
        const tx = wallet.sendTransactions([{}])
        await expectToBeRejected(tx, 'InvalidSignature')
      })

      describe('Universal network signatures', async () => {
        it('Should reject signature for another network id, even if encoded as universal', async () => {
          wallet = wallet.useChainId(CHAIN_ID() + 1)
          const tx = wallet.sendTransactions([{}])
          await expectToBeRejected(tx, 'InvalidSignature')
        })

        it('Should reject signature with chainId zero if not using special encoding', async () => {
          wallet = wallet.useChainId(0)
          const tx = wallet.sendTransactions([{}])
          await expectToBeRejected(tx, 'InvalidSignature')
        })

        it('Should accept transaction with chainId zero if encoded with no chaind type', async () => {
          wallet = wallet.useChainId(0).useEncodingOptions({ signatureType: SignatureType.NoChaindDynamic })
          await wallet.sendTransactions([{}])
        })
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

      describe('Using non-encoded nonce', () => {
        it('Should default to space zero', async () => {
          await wallet.sendTransactions([{}])
          expect(await wallet.mainModule.nonce()).to.equal(1)
        })
  
        it('Should work with zero as initial nonce', async () => {
          await wallet.sendTransactions([{}])
          expect(await wallet.mainModule.readNonce(0)).to.equal(1)
        })

        it('Should emit NonceChange event', async () => {
          const receipt1 = await wallet.sendTransactions([{}]).then((t) => t.wait())
          const receipt2 = await wallet.sendTransactions([{}]).then((t) => t.wait())

          const ev1 = receipt1.events!.find(l => l.event === 'NonceChange')
          expect(ev1!.event).to.be.eql('NonceChange')
          expect(ev1!.args!._space).to.equal(0)
          expect(ev1!.args!._newNonce).to.equal(1)

          const ev2 = receipt2.events!.find(l => l.event === 'NonceChange')
          expect(ev2!.event).to.be.eql('NonceChange')
          expect(ev1!.args!._space).to.equal(0)
          expect(ev2!.args!._newNonce).to.equal(2)
        })
  
        it('Should fail if nonce did not change', async () => {
          await wallet.sendTransactions([{}], 0)
          const tx = wallet.sendTransactions([{}], 0)
          await expectToBeRejected(tx, `BadNonce(0, 0, 1)`)
        })

        it('Should fail if nonce increased by two', async () => {
          await wallet.sendTransactions([{}])
          const tx = wallet.sendTransactions([{}], 2)
          await expectToBeRejected(tx, `BadNonce(0, 2, 1)`)
        })
      })

      spaces.forEach(space => {
        describe(`using ${space.toHexString()} space`, () => {
          it('Should work with zero as initial nonce', async () => {
            await wallet.sendTransactions([{}], encodeNonce(space, 0))
            expect(await wallet.mainModule.readNonce(space)).to.equal(1)
          })

          it('Should emit NonceChange event', async () => {
            const receipt1 = await wallet.sendTransactions([{}], encodeNonce(space, 0)).then((t) => t.wait())
            const receipt2 =await wallet.sendTransactions([{}], encodeNonce(space, 1)).then((t) => t.wait())

            const ev1 = receipt1.events!.find(l => l.event === 'NonceChange')
            expect(ev1!.event).to.be.eql('NonceChange')
            expect(ev1!.args!._space).to.equal(space.toString())
            expect(ev1!.args!._newNonce).to.equal(1)

            const ev2 = receipt2.events!.find(l => l.event === 'NonceChange')
            expect(ev2!.event).to.be.eql('NonceChange')
            expect(ev2!.args!._space).to.equal(space.toString())
            expect(ev2!.args!._newNonce).to.equal(2)
          })

          it('Should accept next nonce', async () => {
            await wallet.sendTransactions([{}], encodeNonce(space, 0))
            await wallet.sendTransactions([{}], encodeNonce(space, 1))

            expect(await wallet.mainModule.readNonce(space)).to.equal(2)
          })

          it('Should fail if nonce did not change', async () => {
            await wallet.sendTransactions([{}], encodeNonce(space, 0))
            const tx = wallet.sendTransactions([{}], encodeNonce(space, 0))

            await expectToBeRejected(tx, `BadNonce(${space.toString()}, 0, 1)`)
          })

          it('Should fail if nonce increased by two', async () => {
            await wallet.sendTransactions([{}], encodeNonce(space, 0))
            const tx = wallet.sendTransactions([{}], encodeNonce(space, 2))

            await expectToBeRejected(tx, `BadNonce(${space.toString()}, 2, 1)`)
          })

          it('Should use nonces storage keys', async () => {
            const subkey = ethers.utils.defaultAbiCoder.encode(['uint256'], [space])
            const storageKey = computeStorageKey('org.arcadeum.module.calls.nonce', subkey)

            await wallet.sendTransactions([{}], encodeNonce(space, 0))

            const storageValue = await hethers.provider.getStorageAt(wallet.address, storageKey)
            expect(ethers.BigNumber.from(storageValue)).to.equal(1)
          })
        })
      })

      describe('using two spaces simultaneously', () => {
        it('Should keep separated nonce counts', async () => {
          await wallet.sendTransactions([{}], encodeNonce(1, 0))

          expect(await wallet.mainModule.readNonce(1)).to.equal(1)
          expect(await wallet.mainModule.readNonce(2)).to.equal(0)

          await wallet.sendTransactions([{}], encodeNonce(2, 0))

          expect(await wallet.mainModule.readNonce(1)).to.equal(1)
          expect(await wallet.mainModule.readNonce(2)).to.equal(1)
          await wallet.sendTransactions([{}], encodeNonce(2, 1))
          await wallet.sendTransactions([{}], encodeNonce(2, 2))

          expect(await wallet.mainModule.readNonce(1)).to.equal(1)
          expect(await wallet.mainModule.readNonce(2)).to.equal(3)
        })

        it('Should emit different events', async () => {
          await wallet.sendTransactions([{}], encodeNonce(1, 0))
          await wallet.sendTransactions([{}], encodeNonce(1, 1))

          const receipt1 = await wallet.sendTransactions([{}], encodeNonce(1, 2)).then((t) => t.wait())
          const receipt2 = await wallet.sendTransactions([{}], encodeNonce(2, 0)).then((t) => t.wait())

          const ev1 = receipt1.events!.find(l => l.event === 'NonceChange')
          expect(ev1!.event).to.be.eql('NonceChange')
          expect(ev1!.args!._space).to.equal(1)
          expect(ev1!.args!._newNonce).to.equal(3)

          const ev2 = receipt2.events!.find(l => l.event === 'NonceChange')
          expect(ev2!.event).to.be.eql('NonceChange')
          expect(ev2!.args!._space).to.equal(2)
          expect(ev2!.args!._newNonce).to.equal(1)
        })

        it('Should not accept nonce of different space', async () => {
          await wallet.sendTransactions([{}], encodeNonce(1, 0))
          const tx = wallet.sendTransactions([{}], encodeNonce(2, 1))
          await expectToBeRejected(tx, `BadNonce(2, 1, 0)`)
        })
      })
    })

    it('Should reject signature with invalid flag', async () => {
      const tx = wallet.relayTransactions([{}], '0x000193812833ff01')
      await expectToBeRejected(tx, 'InvalidSignatureFlag(255)')
    })

    it('Should reject signature with bad encoding type', async () => {
      const tx = wallet.relayTransactions([{}], '0x2012')
      const subDigest = subDigestOf(wallet.address, digestOf([{}], 0))
      await expectToBeRejected(tx, `InvalidSignatureType("0x20")`)
    })
  })

  describe('Upgradeability', () => {
    it('Should update implementation', async () => {
      const newImplementation = await ModuleMock.deploy()

      const transaction = {
        target: wallet.address,
        data: wallet.mainModule.interface.encodeFunctionData(
          'updateImplementation', [newImplementation.address]
        )
      }

      await wallet.sendTransactions([transaction])

      const mock_wallet = ModuleMock.attach(wallet.address)
      const tx = await mock_wallet.ping()
      const receipt = await tx.wait()
      expect(receipt.events![0].event).to.equal('Pong')
    })
    it('Should fail to set implementation to address 0', async () => {
      const transaction = {
        target: wallet.address,
        data: wallet.mainModule.interface.encodeFunctionData(
          'updateImplementation', [ethers.constants.AddressZero]
        )
      }

      const tx = wallet.sendTransactions([transaction])
      await expectToBeRejected(tx, `InvalidImplementation("${ethers.constants.AddressZero}")`)
    })
    it('Should fail to set implementation to non-contract', async () => {
      const transaction = {
        target: wallet.address,
        data: wallet.mainModule.interface.encodeFunctionData(
          'updateImplementation', [accounts[1]]
        )
      }

      const tx = wallet.sendTransactions([transaction])
      await expectToBeRejected(tx, `InvalidImplementation("${accounts[1]}")`)
    })
    it('Should use implementation storage key', async () => {
      await wallet.updateImageHash(ethers.utils.randomBytes(32))

      const storageValue = await hethers.provider.getStorageAt(wallet.address, wallet.address)
      expect(bytes32toAddress(storageValue)).to.equal(context.mainModuleUpgradable.address)
    })
  })

  describe('Extra image hashes', () => {
    ([{
      name: 'using MainModule',
      beforeEach: () => {},
    }, {
      name: 'using MainModuleUpgradable',
      beforeEach: async () => {
        const newConfig = SequenceWallet.basicWallet(context)
        await wallet.updateImageHash(newConfig.imageHash)
        wallet = wallet.useAddress().useConfig(newConfig.config).useSigners(newConfig.signers)
      }
    }]).map((c) => {
      describe(c.name, () => {
        beforeEach(c.beforeEach)

        it('Should accept signatures from multiple imageHashes', async () => {
          const altWallet = SequenceWallet.basicWallet(context, { signing: 3, iddle: 9 })
    
          await wallet.deploy()
          await wallet.addExtraImageHash(altWallet.imageHash)
    
          wallet.sendTransactions([{}], encodeNonce(1, 0))
    
          expect(await wallet.mainModule.extraImageHash(altWallet.imageHash)).to.not.equal(0)
    
          wallet = wallet
            .useAddress()
            .useConfig({ ...altWallet.config, address: undefined })
            .useSigners(altWallet.signers)
    
          await wallet.sendTransactions([{}])
        })

        it('Should reject expired extra imgeHash', async () => {
          const altWallet = SequenceWallet.basicWallet(context, { signing: 3, iddle: 9 })
          await wallet.deploy()
          await wallet.addExtraImageHash(altWallet.imageHash, 100)

          const badWallet1 = wallet
            .useAddress()
            .useConfig({ ...altWallet.config, address: undefined })
            .useSigners(altWallet.signers)

          const tx = badWallet1.sendTransactions([{}])
          await expect(tx).to.be.rejected
        })

        it('Should clear multiple extra imageHashes', async () => {
          const altWallet1 = SequenceWallet.basicWallet(context, { signing: 3, iddle: 9 })
          const altWallet2 = SequenceWallet.basicWallet(context)
    
          await wallet.deploy()
          await wallet.addExtraImageHash(altWallet1.imageHash)
          await wallet.addExtraImageHash(altWallet2.imageHash)
    
          expect(await wallet.mainModule.extraImageHash(altWallet1.imageHash)).to.not.equal(0)
          expect(await wallet.mainModule.extraImageHash(altWallet2.imageHash)).to.not.equal(0)
    
          await wallet.clearExtraImageHashes([altWallet1.imageHash, altWallet2.imageHash])
    
          const badWallet1 = wallet
            .useAddress()
            .useConfig({ ...altWallet1.config, address: undefined })
            .useSigners(altWallet1.signers)
    
          const badWallet2 = wallet
            .useAddress()
            .useConfig({ ...altWallet1.config, address: undefined })
            .useSigners(altWallet1.signers)
      
          expect(await wallet.mainModule.extraImageHash(altWallet1.imageHash)).to.equal(0)
          expect(await wallet.mainModule.extraImageHash(altWallet2.imageHash)).to.equal(0)
    
          await expect(badWallet1.sendTransactions([{}])).to.be.rejected
          await expect(badWallet2.sendTransactions([{}])).to.be.rejected
          await expect(wallet.sendTransactions([{}])).to.be.fulfilled
        })
    
        it('Should fail to set extra imageHashes if not from self', async () => {
          const altWallet = SequenceWallet.basicWallet(context)
          const tx = wallet.mainModule.setExtraImageHash(altWallet.imageHash, Math.floor(Date.now() / 1000) + 1000)
          await expectToBeRejected(tx, `OnlySelfAuth("${accounts[0]}", "${wallet.address}")`)
        })
    
        it('Should fail to clear extra imageHashes if not from self', async () => {
          const tx = wallet.mainModule.clearExtraImageHashes([])
          await expectToBeRejected(tx, `OnlySelfAuth("${accounts[0]}", "${wallet.address}")`)
        })
      })
    })
  })

  describe('Static digests', () => {
    ([{
      name: 'using MainModule',
      beforeEach: () => {},
    }, {
      name: 'using MainModuleUpgradable',
      beforeEach: async () => {
        const newConfig = SequenceWallet.basicWallet(context)
        await wallet.updateImageHash(newConfig.imageHash)
        wallet = wallet.useAddress().useConfig(newConfig.config).useSigners(newConfig.signers)
      }
    }]).map((c) => {
      describe(c.name, () => {
        it('Should accept static digest for sending a transaction', async () => {
          const tx = applyTxDefaults([{}])
          const txDigest = digestOf(tx, encodeNonce(1, 0))

          const expiration = Math.floor(Date.now() / 1000) + 1000

          await wallet.sendTransactions([{
            target: wallet.address,
            data: wallet.mainModule.interface.encodeFunctionData(
              'setStaticDigest',
              [txDigest, expiration])
          }])

          expect(await wallet.mainModule.staticDigest(txDigest)).to.equal(expiration)
          await wallet.mainModule.execute(tx, encodeNonce(1, 0), '0x000000000000')

          const relay2 = wallet.mainModule.execute(tx, encodeNonce(1, 0), '0x000000000000')
          await expectToBeRejected(relay2, `BadNonce(1, 0, 1)`)
        })

        it('Should accept static digest for EIP-1271', async () => {
          const message = ethers.utils.randomBytes(99)
          const digest1 = ethers.utils.keccak256(message)
          const digest2 = ethers.utils.keccak256([])

          expect(await wallet.mainModule['isValidSignature(bytes,bytes)'](digest1, '0x000000000000')).to.equal('0x00000000')
          expect(await wallet.mainModule['isValidSignature(bytes,bytes)'](digest2, '0x000000000000')).to.equal('0x00000000')

          await wallet.sendTransactions([{
            target: wallet.address,
            data: wallet.mainModule.interface.encodeFunctionData(
              'addStaticDigests',
              [[digest1, digest2]]
            )
          }])

          expect(await wallet.mainModule.staticDigest(digest1)).to.equal(ethers.BigNumber.from(2).pow(256).sub(1))
          expect(await wallet.mainModule.staticDigest(digest2)).to.equal(ethers.BigNumber.from(2).pow(256).sub(1))

          expect(await wallet.mainModule['isValidSignature(bytes,bytes)'](message, '0x000000000000')).to.equal('0x20c13b0b')
          expect(await wallet.mainModule['isValidSignature(bytes32,bytes)'](digest2, '0x000000000000')).to.equal('0x1626ba7e')
        })

        it('Should remove static digest', async () => {
          const tx = applyTxDefaults([{}])
          const txDigest = digestOf(tx, encodeNonce(1, 0))

          await wallet.sendTransactions([{
            target: wallet.address,
            data: wallet.mainModule.interface.encodeFunctionData(
              'setStaticDigest',
              [txDigest, ethers.BigNumber.from(2).pow(256).sub(1)])
          }])

          await wallet.sendTransactions([{
            target: wallet.address,
            data: wallet.mainModule.interface.encodeFunctionData(
              'setStaticDigest',
              [txDigest, 0])
          }])

          await expect(wallet.mainModule.execute(tx, encodeNonce(1, 0), '0x0000')).to.be.rejected
        })

        it('Should fail to set static signer if not self', async () => {
          const tx = wallet.mainModule.setStaticDigest(digestOf([{}], encodeNonce(1, 0)), 1)
          await expect(tx).to.be.rejected
        })

        it('Should fail to add static signers if not self', async () => {
          const digests = [digestOf([{}], encodeNonce(1, 0)), digestOf([{}], encodeNonce(2, 0))]
          const tx = wallet.mainModule.addStaticDigests(digests)
          await expect(tx).to.be.rejected
        })

        it('Should add many static digests for transactions at the same time', async () => {
          const tx = applyTxDefaults([{}])
  
          const txDigest1 = digestOf(tx, encodeNonce(1, 0))
          const txDigest2 = digestOf(tx, encodeNonce(2, 0))
          const txDigest3 = digestOf(tx, encodeNonce(3, 0))

          await wallet.sendTransactions([{
            target: wallet.address,
            data: wallet.mainModule.interface.encodeFunctionData(
              'addStaticDigests',
              [[txDigest1, txDigest2, txDigest3]])
          }])

          expect(await wallet.mainModule.staticDigest(txDigest1)).to.equal(ethers.BigNumber.from(2).pow(256).sub(1))
          expect(await wallet.mainModule.staticDigest(txDigest2)).to.equal(ethers.BigNumber.from(2).pow(256).sub(1))
          expect(await wallet.mainModule.staticDigest(txDigest3)).to.equal(ethers.BigNumber.from(2).pow(256).sub(1))

          await wallet.mainModule.execute(tx, encodeNonce(1, 0), '0x000000000000')
          await wallet.mainModule.execute(tx, encodeNonce(2, 0), '0x00ff00000001')
          await wallet.mainModule.execute(tx, encodeNonce(3, 0), '0x0000ffffffff')
        })
      })
    })
  })

  describe('Static merkle digests', () => {
    ([{
      name: 'using MainModule',
      beforeEach: () => {},
    }, {
      name: 'using MainModuleUpgradable',
      beforeEach: async () => {
        const newConfig = SequenceWallet.basicWallet(context)
        await wallet.updateImageHash(newConfig.imageHash)
        wallet = wallet.useAddress().useConfig(newConfig.config).useSigners(newConfig.signers)
      }
    }]).map((c) => {
      describe(c.name, () => {
        it('Should reject proof for another subdigest', async () => {
          const digests = new Array(2).fill(0).map(() => ethers.utils.hexlify(ethers.utils.randomBytes(32)))
          const subDigests = digests.map((d) => ({ subDigest: subDigestOf(wallet.address, d, 0) }))
          const subDigestsMerkle = merkleTopology([...subDigests])

          const prevLeaves = leavesOf(wallet.config.topology)
          const newMerkle = merkleTopology([subDigestsMerkle, ...prevLeaves])
          const newConfig = { threshold: wallet.config.threshold, topology: newMerkle, checkpoint: Math.floor(Date.now() / 1000) }

          await wallet.deploy()
          await wallet.updateImageHash(newConfig)
          wallet = wallet.useAddress(wallet.address).useConfig(newConfig)

          await wallet.sendTransactions([])

          const subDigest = ethers.utils.hexlify(subDigests[0].subDigest)
          const encoded = wallet.staticSubdigestSign(subDigest)
          const res = await wallet.mainModule['isValidSignature(bytes32,bytes)'](digests[1], encoded)
          expect(res).to.equal('0x00000000')
        })

        it('Should accept merkle proof', async () => {
          wallet = SequenceWallet.basicWallet(context, { signing: 10, iddle: 11 })

          const digests = new Array(33).fill(0).map(() => ethers.utils.hexlify(ethers.utils.randomBytes(32)))
          const subDigests = digests.map((d) => ({ subDigest: subDigestOf(wallet.address, d, 0) }))
          const subDigestsMerkle = merkleTopology([...subDigests])

          const prevLeaves = leavesOf(wallet.config.topology)
          const newMerkle = merkleTopology([subDigestsMerkle, ...prevLeaves])
          const newConfig = { threshold: wallet.config.threshold, topology: newMerkle, checkpoint: Math.floor(Date.now() / 1000) }

          await wallet.deploy()
          await wallet.updateImageHash(newConfig)
          wallet = wallet.useAddress(wallet.address).useConfig(newConfig)

          await wallet.sendTransactions([])

          for (let i = 0; i < subDigests.length; i++) {
            const subDigest = ethers.utils.hexlify(subDigests[i].subDigest)
            const encoded = wallet.staticSubdigestSign(subDigest)
            const res = await wallet.mainModule['isValidSignature(bytes32,bytes)'](digests[i], encoded)
            expect(res).to.equal('0x1626ba7e')
          }
        })
      })
    })
  })

  describe('Nested configurations', async () => {
    it('Should use nested configuration as a regular branch', async () => {
      const nested = SequenceWallet.basicWallet(context, { signing: 1, iddle: 11 })
      const simplifiedConfig = {
        threshold: 1,
        checkpoint: 2,
        signers: [{
          address: ethers.Wallet.createRandom().address,
          weight: 1
        }, {
          ...toSimplifiedConfig(nested.config),
          weight: 1
        }]
      }

      const config = {
        ...simplifiedConfig,
        topology: legacyTopology(simplifiedConfig)
      }

      const wallet = new SequenceWallet({ context, config, signers: nested.signers })
      await wallet.deploy()

      await wallet.sendTransactions([])
    })
    it('Should use nested configuration with independent weight and threshold', async () => {
      const nested = SequenceWallet.basicWallet(context, { signing: 2, iddle: 11 })
      const simplifiedConfig = {
        threshold: 5,
        checkpoint: 2,
        signers: [{
          ...toSimplifiedConfig(nested.config),
          weight: 5
        }, {
          address: ethers.Wallet.createRandom().address,
          weight: 1
        }]
      }

      const config = {
        ...simplifiedConfig,
        topology: merkleTopology(simplifiedConfig)
      }

      const wallet = new SequenceWallet({ context, config, signers: nested.signers })
      await wallet.deploy()

      await wallet.sendTransactions([])
    })
    it('Should reject nested configuration if not enough internal signing power', async () => {
      const nested = SequenceWallet.basicWallet(context, { signing: 2, iddle: 11 })

      const simplifiedConfig = {
        threshold: 1,
        checkpoint: 2,
        signers: [{
          ...toSimplifiedConfig(nested.config),
          weight: 5
        }, {
          address: ethers.Wallet.createRandom().address,
          weight: 1
        }]
      }

      const config = {
        ...simplifiedConfig,
        topology: merkleTopology(simplifiedConfig)
      }

      const wallet = new SequenceWallet({ context, config, signers: [nested.signers[0]] })
      await wallet.deploy()

      const tx = wallet.sendTransactions([])
      await expectToBeRejected(tx, 'InvalidSignature')
    })
    it('Should limit nested signing power', async () => {
      const nested = SequenceWallet.basicWallet(context, { signing: 10 })

      const simplifiedConfig = {
        threshold: 2,
        checkpoint: 2,
        signers: [{
          ...toSimplifiedConfig(nested.config),
          weight: 1
        }, {
          address: ethers.Wallet.createRandom().address,
          weight: 1
        }]
      }

      const config = {
        ...simplifiedConfig,
        topology: merkleTopology(simplifiedConfig)
      }

      const wallet = new SequenceWallet({ context, config, signers: nested.signers })
      await wallet.deploy()

      const tx = wallet.sendTransactions([])
      await expectToBeRejected(tx, 'InvalidSignature')
    })
  })

  describe('External calls', () => {
    let { valA, valB } = { valA: Math.floor(Date.now()), valB: randomHex(120) }

    it('Should perform call to contract', async () => {
      const transaction = {
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      await wallet.sendTransactions([transaction])
      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should return error message', async () => {
      await callReceiver.setRevertFlag(true)

      const transaction = {
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [0, []])
      }

      const tx = wallet.sendTransactions([transaction])
      await expect(tx).to.be.rejectedWith('CallReceiverMock#testCall: REVERT_FLAG')
    })
    describe('Batch transactions', () => {
      let callReceiver2: ContractType<typeof CallReceiverMock>
      let { val2A, val2B } = { val2A: 9422, val2B: randomHex(31) }

      beforeEach(async () => {
        callReceiver2 = await CallReceiverMock.deploy()
      })
  
      it('Should perform multiple calls to contracts in one tx', async () => {
        const transactions = [{
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }, {
          target: callReceiver2.address,
          data: callReceiver2.interface.encodeFunctionData('testCall', [val2A, val2B])
        }]

        await wallet.sendTransactions(transactions)
        expect(await callReceiver.lastValA()).to.equal(valA)
        expect(await callReceiver.lastValB()).to.equal(valB)
        expect(await callReceiver2.lastValA()).to.equal(val2A)
        expect(await callReceiver2.lastValB()).to.equal(val2B)
      })

      it('Should perform call a contract and transfer eth in one tx', async () => {
        await hethers.provider.getSigner().sendTransaction({ to: wallet.address, value: 100 })
        const receiver = new ethers.Wallet(ethers.utils.randomBytes(32))

        const transactions = [{
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }, {
          target: receiver.address,
          value: 26,
        }]

        await wallet.sendTransactions(transactions)

        expect(await callReceiver.lastValA()).to.equal(valA)
        expect(await callReceiver.lastValB()).to.equal(valB)
        expect(await hethers.provider.getBalance(receiver.address)).to.equal(26)
      })

      it('Should fail if one transaction fails', async () => {
        await hethers.provider.getSigner().sendTransaction({ to: wallet.address, value: 100 })

        await callReceiver.setRevertFlag(true)

        const transactions = [{
          target: ethers.Wallet.createRandom().address,
          value: 26
        }, {
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [0, []])
        }]

        const tx = wallet.sendTransactions(transactions)
        await expect(tx).to.be.rejectedWith('CallReceiverMock#testCall: REVERT_FLAG')
      })
    })
  })

  describe('Delegate calls', () => {
    let delegateCallMock: ContractType<typeof DelegateCallMock>

    beforeEach(async () => {
      delegateCallMock = await DelegateCallMock.deploy()
    })

    it('Should delegate call to module', async () => {
      const transaction1 = {
        delegateCall: true,
        target: delegateCallMock.address,
        data: delegateCallMock.interface.encodeFunctionData('write', [11, 45])
      }

      await wallet.sendTransactions([transaction1])

      const transaction2 = {
        delegateCall: true,
        target: delegateCallMock.address,
        data: delegateCallMock.interface.encodeFunctionData('read', [11])
      }

      const tx = await wallet.sendTransactions([transaction2])
      const receipt = await tx.wait()
      const val = ethers.BigNumber.from(receipt.logs.slice(-2)[0].data)
      expect(val).to.equal(45)
    })

    describe('on delegate call revert', () => {
      beforeEach(async () => {
        await wallet.sendTransactions([{
          delegateCall: true,
          target: delegateCallMock.address,
          data: delegateCallMock.interface.encodeFunctionData('setRevertFlag', [true])
        }])
      })

      it('Should pass if revertOnError is false', async () => {
        const transaction = {
          delegateCall: true,
          revertOnError: false,
          target: delegateCallMock.address,
          data: delegateCallMock.interface.encodeFunctionData('write', [11, 45])
        }

        await wallet.sendTransactions([transaction])
      })

      it('Should fail if delegate call fails', async () => {
        const transaction = {
          delegateCall: true,
          target: delegateCallMock.address,
          data: delegateCallMock.interface.encodeFunctionData('write', [11, 45])
        }

        const tx = wallet.sendTransactions([transaction])
        await expect(tx).to.be.rejectedWith('DelegateCallMock#write: REVERT_FLAG')
      })
    })
  })

  describe('Handle ETH', () => {
    it('Should receive ETH', async () => {
      hethers.provider.getSigner().sendTransaction({ to: wallet.address, value: 1 })
    })

    it('Should transfer ETH', async () => {
      hethers.provider.getSigner().sendTransaction({ to: wallet.address, value: 100 })

      const receiver = ethers.Wallet.createRandom().address

      const transaction = {
        target: receiver,
        value: 25
      }

      await wallet.sendTransactions([transaction])
      expect(await hethers.provider.getBalance(receiver)).to.equal(25)
    })

    it('Should call payable function', async () => {
      hethers.provider.getSigner().sendTransaction({ to: wallet.address, value: 100 })

      const valA = 63129
      const valB = randomHex(120)
      const value = 33

      const transaction = {
        target: callReceiver.address,
        value: value,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }

      await wallet.sendTransactions([transaction])
      expect(await hethers.provider.getBalance(callReceiver.address)).to.equal(value)
      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
  })

  describe('Optional transactions', () => {
    it('Should skip a skipOnError transaction', async () => {
      await callReceiver.setRevertFlag(true)

      const transaction = {
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [0, []])
      }

      const receipt = await wallet.sendTransactions([transaction]).then((r) => r.wait())
      const event = receipt.events!.pop()

      const reason = ethers.utils.defaultAbiCoder.decode(['string'], "0x" + event!.args!._reason.slice(10))[0]
      expect(reason).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
    })

    describe('With multiple transactions', () => {
      let callReceiver2: ContractType<typeof CallReceiverMock>
      const { valA, valB } = { valA: 912341, valB: randomHex(30) }

      beforeEach(async () => {
        callReceiver2 = await CallReceiverMock.deploy()
      })

      it('Should skip failing transaction within batch', async () => {  
        await callReceiver.setRevertFlag(true)
  
        const transactions = [{
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [0, []])
        }, {
          revertOnError: false,
          target: callReceiver2.address,
          data: callReceiver2.interface.encodeFunctionData('testCall', [valA, valB])
        }]

        const receipt = await wallet.sendTransactions(transactions).then((r) => r.wait())
        const event = receipt.events!.find(l => l.event === 'TxFailed')
  
        const reason = ethers.utils.defaultAbiCoder.decode(['string'], "0x" + event!.args!._reason.slice(10))[0]
        expect(reason).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
  
        expect(await callReceiver2.lastValA()).to.equal(valA)
        expect(await callReceiver2.lastValB()).to.equal(valB)
      })

      it('Should skip multiple failing transactions within batch', async () => {
        await callReceiver.setRevertFlag(true)
  
        const transactions = [{
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [0, []])
        }, {
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [0, []])
        }, {
          target: callReceiver2.address,
          data: callReceiver2.interface.encodeFunctionData('testCall', [valA, valB])
        }]
  
        const txHash = subDigestOf(wallet.address, digestOf(transactions, await wallet.getNonce()))
        const receipt = await wallet.sendTransactions(transactions).then((r) => r.wait())
  
        const event1 = receipt.events![1]
        const event2 = receipt.events![2]
  
        const reason1 = ethers.utils.defaultAbiCoder.decode(['string'], "0x" + event1.args!._reason.slice(10))[0]
        const reason2 = ethers.utils.defaultAbiCoder.decode(['string'], "0x" + event2.args!._reason.slice(10))[0]
  
        expect(reason1).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
        expect(reason2).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
  
        expect(event1.args!._tx).to.equal(txHash)
        expect(event2.args!._tx).to.equal(txHash)
  
        expect(await callReceiver2.lastValA()).to.equal(valA)
        expect(await callReceiver2.lastValB()).to.equal(valB)
      })

      it('Should skip all failing transactions within a batch', async () => {  
        await callReceiver.setRevertFlag(true)
    
        const transactions = [{
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [0, []])
        }, {
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [0, []])
        }]
  
        const receipt = await wallet.sendTransactions(transactions).then((r) => r.wait())
        const event1 = receipt.events!.pop()
        const event2 = receipt.events!.pop()
  
        const reason1 = ethers.utils.defaultAbiCoder.decode(['string'], "0x" + event1!.args!._reason.slice(10))[0]
        const reason2 = ethers.utils.defaultAbiCoder.decode(['string'], "0x" + event2!.args!._reason.slice(10))[0]
  
        expect(reason1).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
        expect(reason2).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
      })
    })
  })

  describe('Hooks', () => {
    let hookCallerMock: ContractType<typeof HookCallerMock>

    before(async () => {
      hookCallerMock = await HookCallerMock.deploy()
    })

    describe('receive tokens', () => {
      it('Should implement ERC1155 single transfer hook', async () => {
        await hookCallerMock.callERC1155Received(wallet.address)
      })
      it('Should implement ERC1155 batch transfer hook', async () => {
        await hookCallerMock.callERC1155BatchReceived(wallet.address)
      })
      it('Should implement ERC721 transfer hook', async () => {
        await hookCallerMock.callERC721Received(wallet.address)
      })
      it('Should implement ERC223 transfer hook', async () => {
        await hookCallerMock.callERC223Received(wallet.address)
      })
    })

    describe('ERC1271 Wallet', () => {
      let message = randomHex(250)
      let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32))

      it('Should validate arbitrary signed data', async () => {
        const signature = await wallet.signMessage(message)
        await hookCallerMock.callERC1271isValidSignatureData(wallet.address, message, signature)
      })

      it('Should validate arbitrary signed hash', async () => {
        const signature = await wallet.signDigest(hash)
        await hookCallerMock.callERC1271isValidSignatureHash(wallet.address, hash, signature)
      })

      it('Should reject data signed by non-owner', async () => {
        const impostor = SequenceWallet.basicWallet(context)
        const signature = await impostor.signMessage(message)
        const tx = hookCallerMock.callERC1271isValidSignatureData(wallet.address, message, signature)
        await expect(tx).to.be.rejectedWith('HookCallerMock#callERC1271isValidSignatureData: INVALID_RETURN')
      })

      it('Should reject hash signed by non-owner', async () => {
        const impostor = SequenceWallet.basicWallet(context)
        const signature = await impostor.signDigest(hash)
        const tx = hookCallerMock.callERC1271isValidSignatureHash(wallet.address, hash, signature)
        await expect(tx).to.be.rejectedWith('HookCallerMock#callERC1271isValidSignatureHash: INVALID_RETURN')
      })
    })

    describe('External hooks', () => {
      let hookMock: ContractType<typeof HookMock>
      let hookSelector: string

      before(async () => {
        hookMock = await HookMock.deploy()
        hookSelector = hookMock.interface.getSighash('onHookMockCall')
      })

      it('Should return zero if hook is not registered', async () => {
        expect(await wallet.mainModule.readHook(hookSelector)).to.be.equal(ethers.constants.AddressZero)
      })

      describe('With registered hook', () => {
        beforeEach(async () => {
          const transaction = {
            target: wallet.address,
            data: wallet.mainModule.interface.encodeFunctionData('addHook', [hookSelector, hookMock.address])
          }
  
          await wallet.sendTransactions([transaction])
        })

        it('Should read added hook', async () => {
          expect(await wallet.mainModule.readHook(hookSelector)).to.be.equal(hookMock.address)
        })

        it('Should forward call to external hook', async () => {
          const walletHook = HookMock.attach(wallet.address)
          expect(await walletHook.onHookMockCall(21)).to.equal(42)
        })

        it('Should not forward call to deregistered hook', async () => {
          const transaction = {
            target: wallet.address,
            data: wallet.mainModule.interface.encodeFunctionData('removeHook', [hookSelector])
          }
  
          await wallet.sendTransactions([transaction])
  
          const tx2 = HookMock.attach(wallet.address).onHookMockCall(21)
          await expect(tx2).to.be.rejected
        })

        it('Should use hooks storage key', async () => {
          const subkey = ethers.utils.defaultAbiCoder.encode(['bytes4'], [hookSelector])
          const storageKey = computeStorageKey('org.arcadeum.module.hooks.hooks', subkey)
  
          const storageValue = await hethers.provider.getStorageAt(wallet.address, storageKey)
  
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

      it('Should pass calling a non registered hook', async () => {
        const data = ethers.utils.defaultAbiCoder.encode(['bytes4'], [hookSelector])
        await hethers.provider.getSigner().sendTransaction({ to: wallet.address, data: data })
      })
    })
  })

  describe('Update owners', async () => {
    let walletb: SequenceWallet

    beforeEach(async () => {
      walletb = SequenceWallet.basicWallet(context, { address: wallet.address })
    })

    it('Should fail to update to invalid image hash', async () => {
      const tx = wallet.updateImageHash(ethers.constants.HashZero)
      await expectToBeRejected(tx, 'ImageHashIsZero()')
    })

    it('Should fail to change image hash from non-self address', async () => {
      const tx = wallet.mainModule.updateImageHash(ethers.utils.randomBytes(32))
      await expectToBeRejected(tx, `OnlySelfAuth("${accounts[0]}", "${wallet.address}")`)
    })

    describe('After a migration', async () => {
      beforeEach(async () => {
        await wallet.updateImageHash(walletb.imageHash)
      })

      it('Should implement new upgradable module', async () => {
        expect(await walletb.mainModuleUpgradable.imageHash()).to.equal(walletb.imageHash)
      })

      it('Should accept new owner signature', async () => {
        await walletb.sendTransactions([{}])
      })

      it('Should reject old owner signature', async () => {
        const tx = wallet.sendTransactions([{}])
        await expect(tx).to.be.rejected
      })

      it('Should fail to update to invalid image hash', async () => {
        const tx = walletb.updateImageHash(ethers.constants.HashZero)
        await expectToBeRejected(tx, 'ImageHashIsZero()')
      })

      it('Should fail to change image hash from non-self address', async () => {
        const tx = wallet.mainModuleUpgradable.updateImageHash(ethers.utils.randomBytes(32))
        await expectToBeRejected(tx, `OnlySelfAuth("${accounts[0]}", "${wallet.address}")`)
      })

      it('Should use image hash storage key', async () => {
        const storageKey = computeStorageKey('org.arcadeum.module.auth.upgradable.image.hash')
        const storageValue = await hethers.provider.getStorageAt(wallet.address, storageKey)
        expect(ethers.utils.defaultAbiCoder.encode(['bytes32'], [storageValue])).to.equal(walletb.imageHash)
      })

      it('Should fail to execute transactions on moduleUpgradable implementation', async () => {
        const tx = context.mainModuleUpgradable.execute([], 0, '0x0000')
        await expect(tx).to.be.rejected
      })

      describe('After updating the image hash', () => {
        let walletc: SequenceWallet

        beforeEach(async () => {
          walletc = SequenceWallet.basicWallet(context, { signing: 2, address: walletb.address })
          await walletb.updateImageHash(walletc.imageHash)
        })

        it('Should have updated the image hash', async () => {
          expect(await walletb.mainModuleUpgradable.imageHash()).to.equal(walletc.imageHash)
        })

        it('Should accept new owners signatures', async () => {
          await walletc.sendTransactions([{}])
        })

        it('Should reject old owner signatures', async () => {
          const tx = walletb.sendTransactions([{}])
          await expect(tx).to.be.rejected
        })

        it('Should use image hash storage key', async () => {
          const storageKey = computeStorageKey('org.arcadeum.module.auth.upgradable.image.hash')
          const storageValue = await hethers.provider.getStorageAt(walletb.address, storageKey)
          expect(ethers.utils.defaultAbiCoder.encode(['bytes32'], [storageValue])).to.equal(walletc.imageHash)
        })
      })
    })
  })

  describe('Multisignature', async () => {
    const modes = [{
      name: "Forced dynamic part encoding, legacy signature type",
      encodingOptions: { forceDynamicEncoding: true, signatureType: SignatureType.Legacy }
    }, {
      name: "Default part encoding, legacy signature encoding",
      encodingOptions: { signatureType: SignatureType.Legacy }
    }, {
      name: "Forced dynamic part encoding, dynamic signature type",
      encodingOptions: { forceDynamicEncoding: true, signatureType: SignatureType.Dynamic }
    }, {
      name: "Default part encoding, dynamic signature type",
      encodingOptions: { signatureType: SignatureType.Legacy }
    }]

    modes.map((mode) => {
      describe(mode.name, () => {
        let encodingOptions = mode.encodingOptions

        describe('With 1/2 wallet', () => {
          let signer1 = ethers.Wallet.createRandom()
          let signer2 = ethers.Wallet.createRandom()

          beforeEach(async () => {
            wallet = SequenceWallet.detailedWallet(context, { threshold: 1, signers: [signer1, signer2], encodingOptions })
            await wallet.deploy()
          })

          it('Should accept signed message by first owner', async () => {
            await wallet.useSigners(signer1).sendTransactions([{}])
          })

          it('Should accept signed message by second owner', async () => {
            await wallet.useSigners(signer2).sendTransactions([{}])
          })

          it('Should accept signed message by both owners', async () => {
            await wallet.useSigners([signer1, signer2]).sendTransactions([{}])
          })

          it('Should reject message without signatures', async () => {
            const tx = wallet.useSigners([]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed by non-owner', async () => {
            const tx = wallet.useSigners(Imposter.random(signer1)).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed by non-owner and signer2', async () => {
            const tx = wallet.useSigners([signer2, Imposter.random(signer1)]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject signature of invalid length', async () => {
            const signature = await wallet.signTransactions([{}])
            const badSignature = signature.slice(0, -2)
            const tx = wallet.relayTransactions([{}], badSignature)
            await expect(tx).to.be.rejected
          })
        })

        describe('With 2/2 wallet', () => {
          let signer1 = ethers.Wallet.createRandom()
          let signer2 = ethers.Wallet.createRandom()

          beforeEach(async () => {
            wallet = SequenceWallet.detailedWallet(context, { threshold: 2, signers: [signer1, signer2], encodingOptions })
            await wallet.deploy()
          })

          it('Should accept signed message by both owners', async () => {
            await wallet.sendTransactions([{}])
          })

          it('Should reject message without signatures', async () => {
            const tx = wallet.useSigners([]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed only by first owner', async () => {
            const tx = wallet.useSigners(signer1).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed only by second owner', async () => {
            const tx = wallet.useSigners(signer2).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed by non-owner', async () => {
            const tx = wallet.useSigners(Imposter.random(signer1)).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })
        })

        describe('With 2/3 wallet', () => {
          let signer1 = ethers.Wallet.createRandom()
          let signer2 = ethers.Wallet.createRandom()
          let signer3 = ethers.Wallet.createRandom()
    
          beforeEach(async () => {
            wallet = SequenceWallet.detailedWallet(context, { threshold: 2, signers: [signer1, signer2, signer3], encodingOptions })
            await wallet.deploy()
          })
    
          it('Should accept signed message by first and second owner', async () => {
            await wallet.useSigners([signer1, signer2]).sendTransactions([{}])
          })

          it('Should accept signed message by first and last owner', async () => {
            await wallet.useSigners([signer1, signer3]).sendTransactions([{}])
          })

          it('Should accept signed message by second and last owner', async () => {
            await wallet.useSigners([signer2, signer3]).sendTransactions([{}])
          })

          it('Should accept signed message by all owners', async () => {
            await wallet.useSigners([signer1, signer2, signer3]).sendTransactions([{}])
          })

          it('Should reject message signed only by first owner', async () => {
            const tx = wallet.useSigners(signer1).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed only by second owner', async () => {
            const tx = wallet.useSigners(signer2).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed only by last owner', async () => {
            const tx = wallet.useSigners(signer3).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message not signed', async () => {
            const tx = wallet.useSigners([]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed by non-owner', async () => {
            const tx = wallet.useSigners(Imposter.random(signer1)).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed by non-owner and signer1', async () => {
            const tx = wallet.useSigners([signer1, Imposter.random(signer2)]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed by two non-owners', async () => {
            const tx = wallet.useSigners([Imposter.random(signer1), Imposter.random(signer2)]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message if signed with a wrong configuration', async () => {
            const tx = wallet.useConfig(SequenceWallet.detailedWallet(context, { threshold: 3, signers: [signer1, signer2] })).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })
        })

        describe('With 3/10 wallet', () => {
          beforeEach(async () => {
            wallet = SequenceWallet.basicWallet(context, { signing: 3, iddle: 7 })
            await wallet.deploy()
          })
  
          it('Should accept message signed by 3/10 owners', async () => {
            await wallet.sendTransactions([{}])
          })
        })
    
        describe('With 255/255 wallet', () => {  
          beforeEach(async () => {
            wallet = SequenceWallet.basicWallet(context, { signing: 215, encodingOptions })
            await wallet.deploy()
          })
  
          it('Should accept message signed by all owners', async () => {
            await wallet.sendTransactions([{}], undefined, { gasLimit: 60000000 })
          })

          it('Should reject message signed by non-owner', async () => {
            const tx = wallet
              .useSigners([Imposter.random(wallet.signers[0] as ethers.Wallet), ...wallet.signers.slice(1)])
              .sendTransactions([{}], undefined, { gasLimit: 60000000 })

            await expect(tx).to.be.rejected
          })

          it('Should reject message signed by all non-owners', async () => {
            const tx = wallet
            .useSigners(wallet.signers.map((s) => Imposter.random(s as ethers.Wallet)))
            .sendTransactions([{}], undefined, { gasLimit: 60000000 })

            await expect(tx).to.be.rejected
          })

          it('Should reject message missing a signature', async () => {
            const tx = wallet
            .useSigners(wallet.signers.slice(1))
            .sendTransactions([{}], undefined, { gasLimit: 60000000 })
            await expect(tx).to.be.rejected
          })
        })
    
        describe('With weighted owners', () => {
          let signers: ethers.Wallet[]
    
          beforeEach(async () => {
            signers = new Array(5).fill(null).map(() => ethers.Wallet.createRandom())
            wallet = SequenceWallet.detailedWallet(context, {
              threshold: 4,
              signers: ([3, 3, 1, 1, 1]).map((weight, i) => ({ weight, value: signers[i] }))
            })
            await wallet.deploy()
          })
    
          it('Should accept signed message with (3+1)/4 weight', async () => {
            await wallet.useSigners([signers[0], signers[3]]).sendTransactions([{}])
          })

          it('Should accept signed message with (3+3)/4 weight', async () => {
            await wallet.useSigners([signers[0], signers[1]]).sendTransactions([{}])
          })

          it('Should accept signed message with (3+3+1+1)/4 weight', async () => {
            await wallet.useSigners(signers.slice(0, 4)).sendTransactions([{}])
          })

          it('Should accept signed message with (3+3+1+1+1)/4 weight (all signers)', async () => {
            await wallet.useSigners(signers).sendTransactions([{}])
          })

          it('Should reject signed message with (1)/4 weight', async () => {
            const tx =  wallet.useSigners([signers[3]]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject signed message with (1+1)/4 weight', async () => {
            const tx = wallet.useSigners([signers[2], signers[3]]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject signed message with (1+1+1)/4 weight', async () => {
            const tx = wallet.useSigners([signers[2], signers[3], signers[4]]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject signed message with (3)/4 weight', async () => {
            const tx = wallet.useSigners(signers[0]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject signed message with (0)/4 weight', async () => {
            const tx = wallet.useSigners([]).sendTransactions([{}])
            await expect(tx).to.be.rejected
          })

          it('Should reject message signed by non-owner', async () => {
            const tx =  wallet.useSigners([signers[0], Imposter.random(signers[3])]).sendTransactions([{}])
            await expect(tx).to.be.rejected
        })

        describe('Reject invalid signatures', () => {
          beforeEach(async () => {
            wallet = SequenceWallet.basicWallet(context, { encodingOptions })
            await wallet.deploy()
          })

          it("Should reject invalid signature type", async () => {
            const signature = await wallet.signTransactions([{}])
            const badSignature = signature.slice(0, -2) + 'ff'
            const tx = wallet.relayTransactions([{}], badSignature)
            await expect(tx).to.be.rejected
          })

          it("Should reject invalid s value", async () => {
            const signature = await wallet.signTransactions([{}])
            const prefix = mode.encodingOptions.forceDynamicEncoding ? 118 : 74
            const invalidSignature = signature.slice(0, prefix) + "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a1" + signature.slice(prefix + 64)
            const tx = wallet.relayTransactions([{}], invalidSignature)
            await expect(tx).to.be.reverted
          })

          it("Should reject invalid v value", async () => {
            const signature = await wallet.signTransactions([{}])
            const prefix = mode.encodingOptions.forceDynamicEncoding ? 182 : 138
            const invalidSignature = signature.slice(0, prefix) + "1a" + signature.slice(prefix + 2)
            const tx = wallet.relayTransactions([{}], invalidSignature)
            await expect(tx).to.be.reverted
          })
        })
      })
    })
    })
  })

  describe('Gas limit', () => {
    let gasBurner: ContractType<typeof GasBurnerMock>

    before(async () => {
      gasBurner = await GasBurnerMock.deploy()
    })

    it('Should forward the defined amount of gas', async () => {
      const gas = 10000

      const transaction = {
        gasLimit: gas,
        target: gasBurner.address,
        data: gasBurner.interface.encodeFunctionData('burnGas', [0])
      }

      const receipt = await wallet.sendTransactions([transaction]).then((t) => t.wait())
      const reported = ethers.BigNumber.from(receipt.logs.slice(-2)[0].data)
      expect(reported).to.be.below(gas)
    })

    it('Should forward different amounts of gas', async () => {
      const gasA = 10000
      const gasB = 350000

      const transactions = [{
        gasLimit: gasA,
        target: gasBurner.address,
        data: gasBurner.interface.encodeFunctionData('burnGas', [8000])
      }, {
        gasLimit: gasB,
        target: gasBurner.address,
        data: gasBurner.interface.encodeFunctionData('burnGas', [340000])
      }]

      const receipt = await wallet.sendTransactions(transactions).then((t) => t.wait())

      const reportedB = ethers.BigNumber.from(receipt.logs.slice(-2)[0].data)
      const reportedA = ethers.BigNumber.from(receipt.logs.slice(-4)[0].data)

      expect(reportedA).to.be.below(gasA)
      expect(reportedB).to.be.below(gasB)
      expect(reportedB).to.be.above(gasA)
    })

    it('Should fail if forwarded call runs out of gas', async () => {
      const gas = 10000

      const transaction = {
        gasLimit: gas,
        target: gasBurner.address,
        data: gasBurner.interface.encodeFunctionData('burnGas', [11000])
      }

      const tx = wallet.sendTransactions([transaction])
      expect(tx).to.be.rejected
    })

    it('Should fail without reverting if optional call runs out of gas', async () => {
      const gas = 10000

      const transaction = {
        revertOnError: false,
        gasLimit: gas,
        target: gasBurner.address,
        data: gasBurner.interface.encodeFunctionData('burnGas', [200000])
      }

      const receipt = await wallet.sendTransactions([transaction]).then((t) => t.wait())
      const log = receipt.events!.pop()
      expect(log!.event).to.be.equal('TxFailed')
    })

    it('Should continue execution if optional call runs out of gas', async () => {
      const gas = 10000

      const valA = 9512358833
      const valB = randomHex(1600)

      const transactions = [{
        revertOnError: false,
        gasLimit: gas,
        target: gasBurner.address,
        data: gasBurner.interface.encodeFunctionData('burnGas', [200000])
      }, {
        revertOnError: true,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }]

      const receipt = await wallet.sendTransactions(transactions).then((t) => t.wait())
      const log = receipt.events!.slice(-2)[0]

      expect(log.event).to.be.equal('TxFailed')
      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })

    it('Should fail if transaction is executed with not enough gas', async () => {
      const transaction = {
        gasLimit: 1000000
      }

      const tx = wallet.sendTransactions([transaction], undefined, { gasLimit: 250000 })
      await expect(tx).to.be.rejected
    })
  })

  describe('Create contracts', () => {
    it('Should create a contract', async () => {
      const deployCode = CallReceiverMock.factory().bytecode

      const transaction = {
        target: wallet.address,
        data: wallet.mainModule.interface.encodeFunctionData('createContract', [deployCode])
      }

      const receipt = await wallet.sendTransactions([transaction]).then((t) => t.wait())
      const log = receipt.events!.find(l => l.event === 'CreatedContract')

      expect(log!.event).to.equal('CreatedContract')

      const deployed = CallReceiverMock.attach(log!.args!._contract)
      await deployed.testCall(12345, '0x552299')

      expect(await deployed.lastValA()).to.equal(12345)
      expect(await deployed.lastValB()).to.equal('0x552299')
    })

    it('Should create a contract with value', async () => {
      const deployCode = CallReceiverMock.factory().bytecode

      await hethers.provider.getSigner().sendTransaction({ to: wallet.address, value: 100 })

      const transaction = {
        target: wallet.address,
        value: 99,
        data: wallet.mainModule.interface.encodeFunctionData('createContract', [deployCode])
      }

      const receipt = await wallet.sendTransactions([transaction]).then((t) => t.wait())
      const log = receipt.events!.find(l => l.event === 'CreatedContract')

      expect(await hethers.provider.getBalance(log!.args!._contract)).to.equal(99)
    })

    it('Should fail to create a contract from non-self', async () => {
      const tx = wallet.mainModule.createContract(CallReceiverMock.factory().bytecode)
      await expectToBeRejected(tx, `OnlySelfAuth("${accounts[0]}", "${wallet.address}")`)
    })
  })

  describe('Transaction events', () => {
    it('Should emit TxExecuted event', async () => {
      const txHash = subDigestOf(wallet.address, digestOf([{}], await wallet.getNonce()))
      const receipt = await wallet.sendTransactions([{}]).then((t) => t.wait())

      const log = receipt.logs[1]

      expect(log.topics.length).to.equal(0)
      expect(log.data).to.be.equal(txHash)
    })

    it('Should emit multiple TxExecuted events', async () => {
      const txHash = subDigestOf(wallet.address, digestOf([{}, {}], await wallet.getNonce()))
      const receipt = await wallet.sendTransactions([{}, {}]).then((t) => t.wait())

      const log1 = receipt.logs[1]
      const log2 = receipt.logs[2]

      expect(log1.topics.length).to.equal(0)
      expect(log1.data).to.be.equal(txHash)

      expect(log2.topics.length).to.equal(0)
      expect(log2.data).to.be.equal(txHash)
    })
  })

  describe('Internal bundles', () => {
    it('Should execute internal bundle', async () => {
      const callReceiver2 = await CallReceiverMock.deploy()

      const expected1 = randomHex(552)
      const expected2 = randomHex(24)

      const bundle = [{
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [11, expected1])
      }, {
        target: callReceiver2.address,
        data: callReceiver2.interface.encodeFunctionData('testCall', [12, expected2])
      }]

      const transaction = [{
        target: wallet.address,
        data: wallet.mainModule.interface.encodeFunctionData('selfExecute', [applyTxDefaults(bundle)])
      }]

      await wallet.sendTransactions(transaction)

      expect(await callReceiver.lastValA()).to.equal(11)
      expect(await callReceiver2.lastValA()).to.equal(12)

      expect(await callReceiver.lastValB()).to.equal(expected1)
      expect(await callReceiver2.lastValB()).to.equal(expected2)
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

      const contracts = await Promise.all((data).flat().map(() => CallReceiverMock.deploy()))
      const expectedb = await Promise.all((data).flat().map((d) => randomHex(d.b)))

      const bundles = data.map(bundle => {
        return applyTxDefaults(bundle.map(obj => ({
          target: contracts[obj.i].address,
          data: contracts[obj.i].interface.encodeFunctionData('testCall', [obj.a, expectedb[obj.i]])
        })))
      })

      const transactions = bundles.map(bundle => ({
        target: wallet.address,
        data: wallet.mainModule.interface.encodeFunctionData('selfExecute', [bundle])
      }))

      await wallet.sendTransactions(transactions)

      const lastValsA = await Promise.all(contracts.map((c) => c.lastValA()))
      const lastValsB = await Promise.all(contracts.map((c) => c.lastValB()))

      lastValsA.forEach((val, i) => expect(val).to.equal(data.flat()[i].a))
      lastValsB.forEach((val, i) => expect(val).to.equal(expectedb[i]))
    })

    it('Should execute nested internal bundles', async () => {
      const callReceiver2 = await CallReceiverMock.deploy()

      const expected1 = randomHex(552)
      const expected2 = randomHex(24)

      const bundle = [{
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [11, expected1])
      }, {
        target: callReceiver2.address,
        data: callReceiver2.interface.encodeFunctionData('testCall', [12, expected2])
      }]

      const nestedBundle = [{
        target: wallet.address,
        data: wallet.mainModule.interface.encodeFunctionData('selfExecute', [applyTxDefaults(bundle)])
      }]

      const transactions = [{
        target: wallet.address,
        data: wallet.mainModule.interface.encodeFunctionData('selfExecute', [applyTxDefaults(nestedBundle)])
      }]

      await wallet.sendTransactions(transactions)

      expect(await callReceiver.lastValA()).to.equal(11)
      expect(await callReceiver2.lastValA()).to.equal(12)

      expect(await callReceiver.lastValB()).to.equal(expected1)
      expect(await callReceiver2.lastValB()).to.equal(expected2)
    })

    it('Should revert bundle without reverting transaction', async () => {
      const callReceiver2 = await CallReceiverMock.deploy()
      const callReceiver3 = await CallReceiverMock.deploy()

      const expected1 = randomHex(552)
      const expected2 = randomHex(24)
      const expected3 = randomHex(11)

      const bundle = [{
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [11, expected1])
      }, {
        target: callReceiver2.address,
        data: callReceiver2.interface.encodeFunctionData('testCall', [12, expected2])
      }, {
        // This transaction will revert
        // because Factory has no fallback
        revertOnError: true,
        target: context.factory.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [12, expected2])
      }]

      const transaction = [{
        revertOnError: false,
        target: wallet.address,
        data: wallet.mainModule.interface.encodeFunctionData('selfExecute', [applyTxDefaults(bundle)])
      }, {
        revertOnError: false,
        target: callReceiver3.address,
        data: callReceiver3.interface.encodeFunctionData('testCall', [51, expected3])
      }]

      await wallet.sendTransactions(transaction)

      expect(await callReceiver.lastValA()).to.equal(0)
      expect(await callReceiver2.lastValA()).to.equal(0)
      expect(await callReceiver3.lastValA()).to.equal(51)

      expect(await callReceiver.lastValB()).to.equal("0x")
      expect(await callReceiver2.lastValB()).to.equal("0x")
      expect(await callReceiver3.lastValB()).to.equal(expected3)
    })
  })

  describe('Update imageHash and IPFS at once', () => {
    ([{
      name: 'using MainModule',
      beforeEach: () => {},
    }, {
      name: 'using MainModuleUpgradable',
      beforeEach: async () => {
        const newConfig = SequenceWallet.basicWallet(context)
        await wallet.updateImageHash(newConfig.imageHash)
        wallet = wallet.useAddress().useConfig(newConfig.config).useSigners(newConfig.signers)
      }
    }]).map((c) => {
      describe(c.name, () => {
        it('Should update imageHash and IPFS at the same time', async () => {
          const ipfs = randomHex(32)
          const imageHash = randomHex(32)

          await wallet.sendTransactions([{
            target: wallet.address,
            data: wallet.mainModule.interface.encodeFunctionData(
              'updateImageHashAndIPFS',
              [imageHash, ipfs]
            )
          }])

          expect(await wallet.mainModuleUpgradable.imageHash()).to.equal(imageHash)
          expect(await wallet.mainModule.ipfsRootBytes32()).to.equal(ipfs)
        })

        it('Should fail to update imageHash and IPFS if caller is not self', async () => {
          const tx = wallet.mainModule.updateImageHashAndIPFS(randomHex(32), randomHex(32))
          await expectToBeRejected(tx, 'OnlySelf')
        })

        it('Updated imageHash should be usable', async () => {
          const nextWallet = SequenceWallet.basicWallet(context)
          const ipfs = randomHex(32)

          await wallet.sendTransactions([{
            target: wallet.address,
            data: wallet.mainModule.interface.encodeFunctionData(
              'updateImageHashAndIPFS',
              [nextWallet.imageHash, ipfs]
            )
          }])

          wallet = wallet.useAddress(wallet.address).useConfig(nextWallet.config).useSigners(nextWallet.signers)
          await wallet.sendTransactions([{}])
        })
      })
    })
  })
})

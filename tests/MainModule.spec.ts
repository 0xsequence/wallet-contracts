import * as ethers from 'ethers'
import {
  expect,
  signAndExecuteMetaTx,
  RevertError,
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
  compareAddr
} from './utils'

import {
  MainModule,
  MainModuleUpgradable,
  Factory,
  CallReceiverMock,
  ModuleMock,
  HookCallerMock,
  HookMock,
  DelegateCallMock,
  GasBurnerMock
} from 'typings/contracts'

import { BigNumberish } from 'ethers'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const FactoryArtifact = artifacts.require('Factory')
const MainModuleArtifact = artifacts.require('MainModule')
const CallReceiverMockArtifact = artifacts.require('CallReceiverMock')
const ModuleMockArtifact = artifacts.require('ModuleMock')
const HookCallerMockArtifact = artifacts.require('HookCallerMock')
const HookMockArtifact = artifacts.require('HookMock')
const DelegateCallMockArtifact = artifacts.require('DelegateCallMock')
const MainModuleUpgradableArtifact = artifacts.require('MainModuleUpgradable')
const GasBurnerMockArtifact = artifacts.require('GasBurnerMock')
const RequireUtilsArtifact = artifacts.require('RequireUtils')

import { web3 } from 'hardhat'

const optimalGasLimit = ethers.constants.Two.pow(21)

contract('MainModule', (accounts: string[]) => {
  let factory
  let module

  let owner
  let wallet

  let moduleUpgradable
  let requireUtils

  let networkId

  before(async () => {
    // Deploy wallet factory
    factory = (await FactoryArtifact.new()) as Factory
    // Deploy MainModule
    module = (await MainModuleArtifact.new(factory.address)) as MainModule
    moduleUpgradable = (await MainModuleUpgradableArtifact.new()) as MainModuleUpgradable
    // Get network ID
    networkId = process.env.NET_ID ? process.env.NET_ID : await web3.eth.net.getId()
    // Deploy RequireUtils
    requireUtils = await RequireUtilsArtifact.new(factory.address, module.address)
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    await factory.deploy(module.address, salt)
    wallet = (await MainModuleArtifact.at(addressOf(factory.address, module.address, salt))) as MainModule
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
          expect(await wallet.nonce()).to.eq.BN(1)
        })
        it('Should work with zero as initial nonce', async () => {
          const nonce = ethers.constants.Zero

          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, nonce)
          expect(await wallet.readNonce(0)).to.eq.BN(1)
        })
        it('Should emit NonceChange event', async () => {
          const receipt1 = (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, 0)) as any
          const receipt2 = (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, 1)) as any

          const ev1 = receipt1.logs.find(l => l.event === 'NonceChange')
          expect(ev1.event).to.be.eql('NonceChange')
          expect(ev1.args._space).to.eq.BN(0)
          expect(ev1.args._newNonce).to.eq.BN(1)

          const ev2 = receipt2.logs.find(l => l.event === 'NonceChange')
          expect(ev2.event).to.be.eql('NonceChange')
          expect(ev1.args._space).to.eq.BN(0)
          expect(ev2.args._newNonce).to.eq.BN(2)
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
            expect(await wallet.readNonce(space)).to.eq.BN(1)
          })
          it('Should emit NonceChange event', async () => {
            const encodedFirstNonce = encodeNonce(space, ethers.constants.Zero)
            const encodedSecondNonce = encodeNonce(space, ethers.constants.One)

            const receipt1 = (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedFirstNonce)) as any
            const receipt2 = (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedSecondNonce)) as any

            const ev1 = receipt1.logs.find(l => l.event === 'NonceChange')
            expect(ev1.event).to.be.eql('NonceChange')
            expect(ev1.args._space).to.eq.BN(space.toString())
            expect(ev1.args._newNonce).to.eq.BN(1)

            const ev2 = receipt2.logs.find(l => l.event === 'NonceChange')
            expect(ev2.event).to.be.eql('NonceChange')
            expect(ev2.args._space).to.eq.BN(space.toString())
            expect(ev2.args._newNonce).to.eq.BN(2)
          })
          it('Should accept next nonce', async () => {
            const encodedFirstNonce = encodeNonce(space, ethers.constants.Zero)
            const encodedSecondNonce = encodeNonce(space, ethers.constants.One)

            await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedFirstNonce)
            await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodedSecondNonce)

            expect(await wallet.readNonce(space)).to.eq.BN(2)
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

          expect(await wallet.readNonce(1)).to.eq.BN(1)
          expect(await wallet.readNonce(2)).to.eq.BN(0)

          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(2, 0))

          expect(await wallet.readNonce(1)).to.eq.BN(1)
          expect(await wallet.readNonce(2)).to.eq.BN(1)

          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(2, 1))
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(2, 2))

          expect(await wallet.readNonce(1)).to.eq.BN(1)
          expect(await wallet.readNonce(2)).to.eq.BN(3)
        })
        it('Should emit different events', async () => {
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(1, 0))
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(1, 1))

          const receipt1 = (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(1, 2))) as any
          const receipt2 = (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(2, 0))) as any

          const ev1 = receipt1.logs.find(l => l.event === 'NonceChange')
          expect(ev1.event).to.be.eql('NonceChange')
          expect(ev1.args._space).to.eq.BN(1)
          expect(ev1.args._newNonce).to.eq.BN(3)

          const ev2 = receipt2.logs.find(l => l.event === 'NonceChange')
          expect(ev2.event).to.be.eql('NonceChange')
          expect(ev2.args._space).to.eq.BN(2)
          expect(ev2.args._newNonce).to.eq.BN(1)
        })
        it('Should not accept nonce of different space', async () => {
          await signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(1, 0))
          const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId, encodeNonce(2, 1))
          await expect(tx).to.be.rejectedWith(RevertError('MainModule#_auth: INVALID_NONCE'))
        })
      })
    })
    it('Should reject signature with invalid flag', async () => {
      const signature = '0x00010201'
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
      const newImplementation = (await ModuleMockArtifact.new()) as ModuleMock

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.contract.methods.updateImplementation(newImplementation.address).encodeABI()
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)

      const mock_wallet = (await ModuleMockArtifact.at(wallet.address)) as ModuleMock
      expect(((await mock_wallet.ping()) as any).logs[0].event).to.equal('Pong')
    })
    it('Should fail to set implementation to address 0', async () => {
      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.contract.methods.updateImplementation(ethers.constants.AddressZero).encodeABI()
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
        data: wallet.contract.methods.updateImplementation(accounts[1]).encodeABI()
      }

      const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      await expect(tx).to.be.rejectedWith(RevertError('ModuleUpdate#updateImplementation: INVALID_IMPLEMENTATION'))
    })
    it('Should use implementation storage key', async () => {
      const newImplementation = (await ModuleMockArtifact.new()) as ModuleMock

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.contract.methods.updateImplementation(newImplementation.address).encodeABI()
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)

      const storageValue = await web3.eth.getStorageAt(wallet.address, wallet.address)

      expect(ethers.utils.getAddress(ethers.utils.hexStripZeros(storageValue))).to.equal(newImplementation.address)
    })
  })
  describe('External calls', () => {
    it('Should perform call to contract', async () => {
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should return error message', async () => {
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      await callReceiver.setRevertFlag(true)

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(0, []).encodeABI()
      }

      const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      await expect(tx).to.be.rejectedWith(RevertError('CallReceiverMock#testCall: REVERT_FLAG'))
    })
    describe('Batch transactions', () => {
      it('Should perform multiple calls to contracts in one tx', async () => {
        const callReceiver1 = (await CallReceiverMockArtifact.new()) as CallReceiverMock
        const callReceiver2 = (await CallReceiverMockArtifact.new()) as CallReceiverMock

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
            data: callReceiver1.contract.methods.testCall(val1A, val1B).encodeABI()
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: callReceiver2.address,
            value: ethers.constants.Zero,
            data: callReceiver2.contract.methods.testCall(val2A, val2B).encodeABI()
          }
        ]

        await signAndExecuteMetaTx(wallet, owner, transactions, networkId)
        expect(await callReceiver1.lastValA()).to.eq.BN(val1A)
        expect(await callReceiver1.lastValB()).to.equal(val1B)
        expect(await callReceiver2.lastValA()).to.eq.BN(val2A)
        expect(await callReceiver2.lastValB()).to.equal(val2B)
      })
      it('Should perform call a contract and transfer eth in one tx', async () => {
        const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
        const receiver = new ethers.Wallet(ethers.utils.randomBytes(32))

        await wallet.send(100, { from: accounts[0] })

        const valA = 5423
        const valB = web3.utils.randomHex(120)

        const transactions = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
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
        expect(await callReceiver.lastValA()).to.eq.BN(valA)
        expect(await callReceiver.lastValB()).to.equal(valB)
        expect(await web3.eth.getBalance(receiver.address)).to.eq.BN(26)
      })
      it('Should fail if one transaction fails', async () => {
        const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
        const receiver = new ethers.Wallet(ethers.utils.randomBytes(32))

        await callReceiver.setRevertFlag(true)
        await wallet.send(100, { from: accounts[0] })

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
            data: callReceiver.contract.methods.testCall(0, []).encodeABI()
          }
        ]

        const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
        await expect(tx).to.be.rejectedWith('CallReceiverMock#testCall: REVERT_FLAG')
      })
    })
  })
  describe('Delegate calls', () => {
    let module
    beforeEach(async () => {
      module = (await DelegateCallMockArtifact.new()) as DelegateCallMock
    })
    it('Should delegate call to module', async () => {
      const transaction1 = {
        delegateCall: true,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: module.address,
        value: 0,
        data: module.contract.methods.write(11, 45).encodeABI()
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction1], networkId)

      const transaction2 = {
        delegateCall: true,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: module.address,
        value: 0,
        data: module.contract.methods.read(11).encodeABI()
      }

      const tx = (await signAndExecuteMetaTx(wallet, owner, [transaction2], networkId)) as any
      const val = web3.utils.toBN(tx.receipt.rawLogs.slice(-2)[0].data)
      expect(val).to.eq.BN(45)
    })
    context('on delegate call revert', () => {
      beforeEach(async () => {
        const transaction = {
          delegateCall: true,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: module.address,
          value: 0,
          data: module.contract.methods.setRevertFlag(true).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      })
      it('Should pass if delegate call is optional', async () => {
        const transaction = {
          delegateCall: true,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: module.address,
          value: 0,
          data: module.contract.methods.write(11, 45).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      })
      it('Should fail if delegate call fails', async () => {
        const transaction = {
          delegateCall: true,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: module.address,
          value: 0,
          data: module.contract.methods.write(11, 45).encodeABI()
        }

        const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('DelegateCallMock#write: REVERT_FLAG')
      })
    })
  })
  describe('Handle ETH', () => {
    it('Should receive ETH', async () => {
      await wallet.send(1, { from: accounts[0] })
    })
    it('Should transfer ETH', async () => {
      await wallet.send(100, { from: accounts[0] })

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
      await wallet.send(100, { from: accounts[0] })

      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      const valA = 63129
      const valB = web3.utils.randomHex(120)
      const value = 33

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: value,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
      expect(await web3.eth.getBalance(callReceiver.address)).to.eq.BN(value)
      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
  })
  describe('Optional transactions', () => {
    it('Should skip a skipOnError transaction', async () => {
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      await callReceiver.setRevertFlag(true)

      const data = callReceiver.contract.methods.testCall(0, []).encodeABI()

      const transaction = {
        delegateCall: false,
        revertOnError: false,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: data
      }

      const tx = (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)) as any
      const event = tx.logs.pop()

      const reason = web3.eth.abi.decodeParameter('string', event.args._reason.slice(10))

      expect(reason).to.equal('CallReceiverMock#testCall: REVERT_FLAG')

      expect(event.args._index).to.eq.BN(0)
    })
    it('Should skip failing transaction within batch', async () => {
      const callReceiver1 = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      const callReceiver2 = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      await callReceiver1.setRevertFlag(true)

      const valA = 912341
      const valB = web3.utils.randomHex(30)

      const data1 = callReceiver1.contract.methods.testCall(0, []).encodeABI()
      const data2 = callReceiver2.contract.methods.testCall(valA, valB).encodeABI()

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

      const tx = (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)) as any
      const event = tx.logs.find(l => l.event === 'TxFailed')

      const reason = web3.eth.abi.decodeParameter('string', event.args._reason.slice(10))

      expect(reason).to.equal('CallReceiverMock#testCall: REVERT_FLAG')

      expect(await callReceiver2.lastValA()).to.eq.BN(valA)
      expect(await callReceiver2.lastValB()).to.equal(valB)
    })
    it('Should skip multiple failing transactions within batch', async () => {
      const callReceiver1 = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      const callReceiver2 = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      await callReceiver1.setRevertFlag(true)

      const valA = 912341
      const valB = web3.utils.randomHex(30)

      const data1 = callReceiver1.contract.methods.testCall(0, []).encodeABI()
      const data2 = callReceiver2.contract.methods.testCall(valA, valB).encodeABI()

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

      const tx = (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)) as any

      const event1 = tx.logs[1]
      const event2 = tx.logs[2]

      const reason1 = web3.eth.abi.decodeParameter('string', event1.args._reason.slice(10))
      const reason2 = web3.eth.abi.decodeParameter('string', event2.args._reason.slice(10))

      expect(reason1).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
      expect(reason2).to.equal('CallReceiverMock#testCall: REVERT_FLAG')

      expect(event1.args._tx).to.equal(txHash)
      expect(event2.args._tx).to.equal(txHash)

      expect(await callReceiver2.lastValA()).to.eq.BN(valA)
      expect(await callReceiver2.lastValB()).to.equal(valB)
    })
    it('Should skip all failing transactions within batch', async () => {
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      await callReceiver.setRevertFlag(true)

      const data = callReceiver.contract.methods.testCall(0, []).encodeABI()

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

      const tx = (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)) as any
      const event1 = tx.logs.pop()
      const event2 = tx.logs.pop()

      const reason1 = web3.eth.abi.decodeParameter('string', event1.args._reason.slice(10))
      const reason2 = web3.eth.abi.decodeParameter('string', event2.args._reason.slice(10))

      expect(reason1).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
      expect(reason2).to.equal('CallReceiverMock#testCall: REVERT_FLAG')
    })
    it('Should skip skipOnError update implementation action', async () => {
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      await callReceiver.setRevertFlag(true)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.updateImplementation(ethers.constants.AddressZero).encodeABI()
        }
      ]

      const tx = (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)) as any
      const event = tx.logs.pop()

      const reason = web3.eth.abi.decodeParameter('string', event.args._reason.slice(10))

      expect(reason).to.equal('ModuleUpdate#updateImplementation: INVALID_IMPLEMENTATION')
      expect(await wallet.nonce()).to.eq.BN(1)
    })
  })
  describe('Hooks', () => {
    let hookMock
    before(async () => {
      hookMock = (await HookCallerMockArtifact.new()) as HookCallerMock
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
      let data
      let message
      let hash
      beforeEach(async () => {
        data = await web3.utils.randomHex(250)
        message = ethers.utils.solidityPack(
          ['string', 'uint256', 'address', 'bytes'],
          ['\x19\x01', networkId, wallet.address, ethers.utils.keccak256(data)]
        )
        hash = ethers.utils.keccak256(message)
      })
      it('Should validate arbitrary signed data', async () => {
        const signature = await walletSign(owner, message)
        await hookMock.callERC1271isValidSignatureData(wallet.address, data, signature)
      })
      it('Should validate arbitrary signed hash', async () => {
        const signature = await walletSign(owner, message)
        await hookMock.callERC1271isValidSignatureHash(wallet.address, hash, signature)
      })
      it('Should reject data signed by non-owner', async () => {
        const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
        const signature = await walletSign(impostor, message)
        const tx = hookMock.callERC1271isValidSignatureData(wallet.address, data, signature)
        await expect(tx).to.be.rejectedWith('HookCallerMock#callERC1271isValidSignatureData: INVALID_RETURN')
      })
      it('Should reject hash signed by non-owner', async () => {
        const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
        const signature = await walletSign(impostor, message)
        const tx = hookMock.callERC1271isValidSignatureHash(wallet.address, hash, signature)
        await expect(tx).to.be.rejectedWith('HookCallerMock#callERC1271isValidSignatureHash: INVALID_RETURN')
      })
    })
    describe('External hooks', () => {
      let hookMock
      before(async () => {
        hookMock = (await HookMockArtifact.new()) as HookMock
      })
      it('Should read added hook', async () => {
        const selector = hookMock.abi.find(i => i.name === 'onHookMockCall').signature
        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.addHook(selector, hookMock.address).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)

        expect(await wallet.readHook(selector)).to.be.equal(hookMock.address)
      })
      it('Should return zero if hook is not registered', async () => {
        const selector = hookMock.abi.find(i => i.name === 'onHookMockCall').signature
        expect(await wallet.readHook(selector)).to.be.equal(ethers.constants.AddressZero)
      })
      it('Should forward call to external hook', async () => {
        const selector = hookMock.abi.find(i => i.name === 'onHookMockCall').signature
        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.addHook(selector, hookMock.address).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)

        const walletHook = (await HookMockArtifact.at(wallet.address)) as HookMock
        expect(await walletHook.onHookMockCall(21)).to.eq.BN(42)
      })
      it('Should not forward call to deregistered hook', async () => {
        const selector = hookMock.abi.find(i => i.name === 'onHookMockCall').signature
        const transaction1 = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.addHook(selector, hookMock.address).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction1], networkId)

        const transaction2 = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.removeHook(selector).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction2], networkId)

        const walletHook = (await HookMockArtifact.at(wallet.address)) as HookMock
        const tx = walletHook.onHookMockCall(21)
        await expect(tx).to.be.rejectedWith("Returned values aren't valid, did it run Out of Gas?")
      })
      it('Should pass calling a non registered hook', async () => {
        const selector = hookMock.abi.find(i => i.name === 'onHookMockCall').signature
        const data = ethers.utils.defaultAbiCoder.encode(['bytes4'], [selector])
        await web3.eth.sendTransaction({ from: accounts[0], to: wallet.address, data: data, gasPrice: 0 })
      })
      it('Should use hooks storage key', async () => {
        const selector = hookMock.abi.find(i => i.name === 'onHookMockCall').signature
        const subkey = ethers.utils.defaultAbiCoder.encode(['bytes4'], [selector])
        const storageKey = moduleStorageKey('org.arcadeum.module.hooks.hooks', subkey)

        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.addHook(selector, hookMock.address).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
        const storageValue = await web3.eth.getStorageAt(wallet.address, storageKey)

        expect(ethers.utils.getAddress(ethers.utils.defaultAbiCoder.decode(['address'], storageValue)[0])).to.equal(
          hookMock.address
        )
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
        wallet2addr = addressOf(factory.address, module.address, salt2)
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
              data: requireUtils.contract.methods
                .publishConfig(wallet2addr, threshold, [
                  {
                    signer: owner2.address,
                    weight: 1
                  }
                ], false)
                .encodeABI()
            }
          ],
          networkId
        )
      })
      it('Should publish configuration of deployed wallet', async () => {
        await factory.deploy(module.address, salt2)
        const wallet2 = (await MainModuleArtifact.at(wallet2addr)) as MainModule
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
              data: requireUtils.contract.methods
                .publishConfig(wallet2.address, threshold, [
                  {
                    signer: owner2.address,
                    weight: 1
                  }
                ], false)
                .encodeABI()
            }
          ],
          networkId
        )
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
              data: requireUtils.contract.methods
                .publishConfig(wallet2addr, threshold, [
                  {
                    signer: owner2.address,
                    weight: 2
                  }
                ], false)
                .encodeABI()
            }
          ],
          networkId
        )
        await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#publishConfig: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH'))
      })
      it('Should fail to publish wrong configuration of a non-updated wallet', async () => {
        await factory.deploy(module.address, salt2)
        const wallet2 = (await MainModuleArtifact.at(wallet2addr)) as MainModule
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
              data: requireUtils.contract.methods
                .publishConfig(wallet2.address, threshold, [
                  {
                    signer: owner2.address,
                    weight: 2
                  }
                ], false)
                .encodeABI()
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
        wallet2addr = addressOf(factory.address, module.address, salt2)
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
              data: requireUtils.contract.methods
                .publishConfig(wallet2addr, threshold, [
                  {
                    signer: owner2.address,
                    weight: 1
                  }
                ], true)
                .encodeABI()
            }
          ],
          networkId
        )

        const blockHeight = await requireUtils.lastWalletUpdate(wallet2addr)
        expect((tx as any).receipt.blockNumber).to.equal(blockHeight.toNumber())
      })
      it('Should publish configuration of a deployed wallet', async () => {
        await factory.deploy(module.address, salt2)
        const wallet2 = (await MainModuleArtifact.at(wallet2addr)) as MainModule
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
              data: requireUtils.contract.methods
                .publishConfig(wallet2.address, threshold, [
                  {
                    signer: owner2.address,
                    weight: 1
                  }
                ], true)
                .encodeABI()
            }
          ],
          networkId
        )

        const blockHeight = await requireUtils.lastWalletUpdate(wallet2.address)
        expect((tx as any).receipt.blockNumber).to.equal(blockHeight.toNumber())
      })
      it('Should publish configuration of an updated wallet', async () => {
        await factory.deploy(module.address, salt2)
        const wallet2 = (await MainModuleArtifact.at(wallet2addr)) as MainModule

        const newOwnerA = ethers.Wallet.createRandom()
        const newImageHash = encodeImageHash(1, [{ weight: 1, address: newOwnerA.address }])

        const newWallet = (await MainModuleUpgradableArtifact.at(wallet2.address)) as MainModuleUpgradable

        const migrateBundle = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Two.pow(18),
            target: newWallet.address,
            value: ethers.constants.Zero,
            data: newWallet.contract.methods.updateImplementation(moduleUpgradable.address).encodeABI()
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Two.pow(18),
            target: newWallet.address,
            value: ethers.constants.Zero,
            data: newWallet.contract.methods.updateImageHash(newImageHash).encodeABI()
          }
        ]

        const migrateTransaction = [
          {
            delegateCall: false,
            revertOnError: false,
            gasLimit: optimalGasLimit,
            target: newWallet.address,
            value: ethers.constants.Zero,
            data: newWallet.contract.methods.selfExecute(migrateBundle).encodeABI()
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
              data: requireUtils.contract.methods
                .publishConfig(wallet2.address, threshold, [
                  {
                    signer: newOwnerA.address,
                    weight: 1
                  }
                ], true)
                .encodeABI()
            }
          ],
          networkId
        )

        const blockHeight = await requireUtils.lastWalletUpdate(wallet2addr)
        expect((tx as any).receipt.blockNumber).to.equal(blockHeight.toNumber())
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
              data: requireUtils.contract.methods
                .publishConfig(wallet2addr, threshold, [
                  {
                    signer: owner2.address,
                    weight: 2
                  }
                ], true)
                .encodeABI()
            }
          ],
          networkId
        )
        await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#publishConfig: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH'))
      })
      it('Should fail to publish wrong configuration of a deployed wallet', async () => {
        await factory.deploy(module.address, salt2)
        const wallet2 = (await MainModuleArtifact.at(wallet2addr)) as MainModule
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
              data: requireUtils.contract.methods
                .publishConfig(wallet2.address, threshold, [
                  {
                    signer: owner2.address,
                    weight: 2
                  }
                ], true)
                .encodeABI()
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
      let signature: string
      let config: { weight: number, address: string, signer?: ethers.Wallet }[]

      beforeEach(async () => {
        owner2a = new ethers.Wallet(ethers.utils.randomBytes(32))
        owner2b = new ethers.Wallet(ethers.utils.randomBytes(32))
        owner2c = new ethers.Wallet(ethers.utils.randomBytes(32))

        config = [{ weight: 1, address: owner2a.address, signer: owner2a }, { weight: 1, address: owner2b.address, signer: owner2b }, { weight: 1, address: owner2c.address }]
        salt2 = encodeImageHash(threshold, config)
        wallet2addr = addressOf(factory.address, module.address, salt2)

        message = ethers.utils.hexlify(ethers.utils.randomBytes(96))
        digest = ethers.utils.keccak256(message)
        signature = await walletMultiSign([{ weight: 1, owner: owner2a }, { weight: 1, owner: owner2b }, { weight: 1, owner: owner2c.address }], threshold, message)
      })

      const options = [{
        name: 'indexed',
        indexed: true
      }, {
        name: 'not indexed',
        indexed: false
      }]

      options.map((o) => {
        context(o.name, () => {
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
                  data: requireUtils.contract.methods
                    .publishInitialSigners(
                      wallet2addr,
                      digest,
                      3,
                      signature,
                      o.indexed
                    )
                    .encodeABI()
                }
              ],
              networkId
            )
    
            const logs = (tx as any).receipt.rawLogs as any[]
            
            const owner2aLog = logs.find((l) =>
              (
                l.topics.length === 3 &&
                l.topics[0] === '0x600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f' &&
                l.topics[2] === ethers.utils.defaultAbiCoder.encode(['address'], [owner2a.address])
              )
            )
    
            expect(owner2aLog).to.not.be.undefined
            expect(owner2aLog.topics[1]).to.equal(ethers.utils.defaultAbiCoder.encode(['address'], [wallet2addr]))
    
            const owner2bLog = logs.find((l) =>
              (
                l.topics.length === 3 &&
                l.topics[0] === '0x600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f' &&
                l.topics[2] === ethers.utils.defaultAbiCoder.encode(['address'], [owner2b.address])
              )
            )
    
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

            expect((await requireUtils.lastSignerUpdate(owner2a.address)).toNumber()).to.equal(o.indexed ? (tx as any).receipt.blockNumber : 0)
            expect((await requireUtils.lastSignerUpdate(owner2b.address)).toNumber()).to.equal(o.indexed ? (tx as any).receipt.blockNumber : 0)
            expect((await requireUtils.lastSignerUpdate(owner2c.address)).toNumber()).to.equal(0)

            expect((await requireUtils.lastWalletUpdate(wallet2addr)).toNumber()).to.equal(o.indexed ? (tx as any).receipt.blockNumber : 0)
          })
    
          it('Should publish signers of a deployed wallet', async () => {
            await factory.deploy(module.address, salt2)
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
                  data: requireUtils.contract.methods
                    .publishInitialSigners(
                      wallet2addr,
                      digest,
                      3,
                      signature,
                      o.indexed
                    )
                    .encodeABI()
                }
              ],
              networkId
            )
    
            const logs = (tx as any).receipt.rawLogs as any[]
            
            const owner2aLog = logs.find((l) =>
              (
                l.topics.length === 3 &&
                l.topics[0] === '0x600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f' &&
                l.topics[2] === ethers.utils.defaultAbiCoder.encode(['address'], [owner2a.address])
              )
            )
    
            expect(owner2aLog).to.not.be.undefined
            expect(owner2aLog.topics[1]).to.equal(ethers.utils.defaultAbiCoder.encode(['address'], [wallet2addr]))
    
            const owner2bLog = logs.find((l) =>
              (
                l.topics.length === 3 &&
                l.topics[0] === '0x600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f' &&
                l.topics[2] === ethers.utils.defaultAbiCoder.encode(['address'], [owner2b.address])
              )
            )
    
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

            expect((await requireUtils.lastSignerUpdate(owner2a.address)).toNumber()).to.equal(o.indexed ? (tx as any).receipt.blockNumber : 0)
            expect((await requireUtils.lastSignerUpdate(owner2b.address)).toNumber()).to.equal(o.indexed ? (tx as any).receipt.blockNumber : 0)
            expect((await requireUtils.lastSignerUpdate(owner2c.address)).toNumber()).to.equal(0)

            expect((await requireUtils.lastWalletUpdate(wallet2addr)).toNumber()).to.equal(o.indexed ? (tx as any).receipt.blockNumber : 0)
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
                  data: requireUtils.contract.methods
                    .publishInitialSigners(
                      wallet2addr,
                      digest,
                      1,
                      "0x0001ff01ab5801a7d398351b8be11c439e05c5b3259aec9b",
                      o.indexed
                    )
                    .encodeABI()
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
                  data: requireUtils.contract.methods
                    .publishInitialSigners(
                      wallet2addr,
                      digest,
                      4,
                      signature,
                      o.indexed
                    )
                    .encodeABI()
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
                  data: requireUtils.contract.methods
                    .publishInitialSigners(
                      wallet2addr,
                      digest,
                      2,
                      invalidSignature,
                      o.indexed
                    )
                    .encodeABI()
                }
              ],
              networkId
            )
    
            await expect(tx).to.be.rejectedWith(RevertError("RequireUtils#publishInitialSigners: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH"))
          })
          it('Should fail to publish signers of deployed wallet with invalid signature', async () => {
            await factory.deploy(module.address, salt2)

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
                  data: requireUtils.contract.methods
                    .publishInitialSigners(
                      wallet2addr,
                      digest,
                      2,
                      invalidSignature,
                      o.indexed
                    )
                    .encodeABI()
                }
              ],
              networkId
            )
    
            await expect(tx).to.be.rejectedWith(RevertError("RequireUtils#publishInitialSigners: UNEXPECTED_COUNTERFACTUAL_IMAGE_HASH"))
          })
          it('Should fail to publish signers of updated wallet with invalid signature', async () => {
            await factory.deploy(module.address, salt2)

            const wallet2 = (await MainModuleArtifact.at(wallet2addr)) as MainModule

            const newOwnerA = ethers.Wallet.createRandom()
            const newImageHash = encodeImageHash(1, [{ weight: 1, address: newOwnerA.address }])
    
            const newWallet = (await MainModuleUpgradableArtifact.at(wallet2.address)) as MainModuleUpgradable
    
            const migrateBundle = [
              {
                delegateCall: false,
                revertOnError: true,
                gasLimit: ethers.constants.Two.pow(18),
                target: newWallet.address,
                value: ethers.constants.Zero,
                data: newWallet.contract.methods.updateImplementation(moduleUpgradable.address).encodeABI()
              },
              {
                delegateCall: false,
                revertOnError: true,
                gasLimit: ethers.constants.Two.pow(18),
                target: newWallet.address,
                value: ethers.constants.Zero,
                data: newWallet.contract.methods.updateImageHash(newImageHash).encodeABI()
              }
            ]
    
            const migrateTransaction = [
              {
                delegateCall: false,
                revertOnError: false,
                gasLimit: optimalGasLimit,
                target: newWallet.address,
                value: ethers.constants.Zero,
                data: newWallet.contract.methods.selfExecute(migrateBundle).encodeABI()
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
                  data: requireUtils.contract.methods
                    .publishInitialSigners(
                      wallet2addr,
                      digest,
                      1,
                      signature,
                      o.indexed
                    )
                    .encodeABI()
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

    let newOwnerA
    let newImageHash

    context('After a migration', async () => {
      beforeEach(async () => {
        newOwnerA = new ethers.Wallet(ethers.utils.randomBytes(32))
        newImageHash = encodeImageHash(1, [{ weight: 1, address: newOwnerA.address }])

        const newWallet = (await MainModuleUpgradableArtifact.at(wallet.address)) as MainModuleUpgradable

        const migrateBundle = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Two.pow(18),
            target: wallet.address,
            value: ethers.constants.Zero,
            data: wallet.contract.methods.updateImplementation(moduleUpgradable.address).encodeABI()
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Two.pow(18),
            target: wallet.address,
            value: ethers.constants.Zero,
            data: newWallet.contract.methods.updateImageHash(newImageHash).encodeABI()
          }
        ]

        const migrateTransaction = [
          {
            delegateCall: false,
            revertOnError: false,
            gasLimit: optimalGasLimit,
            target: wallet.address,
            value: ethers.constants.Zero,
            data: wallet.contract.methods.selfExecute(migrateBundle).encodeABI()
          }
        ]

        await signAndExecuteMetaTx(wallet, owner, migrateTransaction, networkId)
        wallet = newWallet
      })
      it('Should implement new upgradable module', async () => {
        expect(await wallet.imageHash()).to.equal(newImageHash)
      })
      it('Should accept new owner signature', async () => {
        await signAndExecuteMetaTx(wallet, newOwnerA, [transaction], networkId)
      })
      it('Should reject old owner signature', async () => {
        const tx = signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
      })
      it('Should fail to update to invalid image hash', async () => {
        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.updateImageHash('0x').encodeABI()
        }
        const tx = signAndExecuteMetaTx(wallet, newOwnerA, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleAuthUpgradable#updateImageHash INVALID_IMAGE_HASH')
      })
      it('Should fail to change image hash from non-self address', async () => {
        const tx = wallet.updateImageHash(ethers.utils.hexlify(ethers.utils.randomBytes(32)), { from: accounts[0] })
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

        const migrateTransactions = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: wallet.address,
            value: ethers.constants.Zero,
            data: wallet.contract.methods.updateImageHash(newImageHash).encodeABI()
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Zero,
            target: requireUtils.address,
            value: ethers.constants.Zero,
            data: requireUtils.contract.methods
              .publishConfig(
                wallet.address,
                threshold,
                members.sort((a, b) => compareAddr(a.signer, b.signer)),
                false
              )
              .encodeABI()
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

        const migrateTransactions = [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: wallet.address,
            value: ethers.constants.Zero,
            data: wallet.contract.methods.updateImageHash(newImageHash).encodeABI()
          },
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Zero,
            target: requireUtils.address,
            value: ethers.constants.Zero,
            data: requireUtils.contract.methods
              .publishConfig(
                wallet.address,
                threshold,
                members.sort((a, b) => compareAddr(a.signer, b.signer)),
                false
              )
              .encodeABI()
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
              data: wallet.contract.methods.updateImageHash(newImageHash).encodeABI()
            }
          ]

          await signAndExecuteMetaTx(wallet, newOwnerA, migrateTransactions, networkId)
        })
        it('Should have updated the image hash', async () => {
          expect(await wallet.imageHash()).to.equal(newImageHash)
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

    context('With 1/2 wallet', () => {
      let owner1
      let owner2
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

        await factory.deploy(module.address, salt)
        wallet = (await MainModuleArtifact.at(addressOf(factory.address, module.address, salt))) as MainModule
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

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
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

        await factory.deploy(module.address, salt)
        wallet = (await MainModuleArtifact.at(addressOf(factory.address, module.address, salt))) as MainModule
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

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        await factory.deploy(module.address, salt)
        wallet = (await MainModuleArtifact.at(addressOf(factory.address, module.address, salt))) as MainModule
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

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
      })
    })

    if (!process.env.COVERAGE) {
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

          await factory.deploy(module.address, salt)
          wallet = (await MainModuleArtifact.at(addressOf(factory.address, module.address, salt))) as MainModule
        })

        it('Should accept message signed by all owners', async () => {
          const accounts = owners.map(owner => ({
            weight: weight,
            owner: owner
          }))

          await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

          const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
          await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
        })
        it('Should reject message missing a signature', async () => {
          const accounts = owners.slice(1).map(owner => ({
            weight: weight,
            owner: owner
          }))

          const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
          await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
        })
      })
    }

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

        await factory.deploy(module.address, salt)
        wallet = (await MainModuleArtifact.at(addressOf(factory.address, module.address, salt))) as MainModule
      })

      it('Should accept signed message with (3+1)/4 weight', async () => {
        const signers = [0, 3]

        const accounts = owners.map((owner, i) => ({
          weight: weights[i],
          owner: signers.includes(i) ? owner : owner.address
        }))

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
      })
      it('Should accept signed message with (3+3)/4 weight', async () => {
        const signers = [0, 1]

        const accounts = owners.map((owner, i) => ({
          weight: weights[i],
          owner: signers.includes(i) ? owner : owner.address
        }))

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
      })
      it('Should accept signed message with (3+3+1+1)/4 weight', async () => {
        const signers = [0, 1, 2, 3]

        const accounts = owners.map((owner, i) => ({
          weight: weights[i],
          owner: signers.includes(i) ? owner : owner.address
        }))

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
      })
      it('Should accept signed message with (3+3+1+1+1)/4 weight', async () => {
        const signers = [0, 1, 2, 3, 4]

        const accounts = owners.map((owner, i) => ({
          weight: weights[i],
          owner: signers.includes(i) ? owner : owner.address
        }))

        await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
      })
      it('Should reject signed message with (1)/4 weight', async () => {
        const signers = [3]

        const accounts = owners.map((owner, i) => ({
          weight: weights[i],
          owner: signers.includes(i) ? owner : owner.address
        }))

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
      })
      it('Should reject signed message with (1+1)/4 weight', async () => {
        const signers = [2, 3]

        const accounts = owners.map((owner, i) => ({
          weight: weights[i],
          owner: signers.includes(i) ? owner : owner.address
        }))

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
      })
      it('Should reject signed message with (1+1+1)/4 weight', async () => {
        const signers = [2, 3, 4]

        const accounts = owners.map((owner, i) => ({
          weight: weights[i],
          owner: signers.includes(i) ? owner : owner.address
        }))

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
      })
      it('Should reject signed message with (3)/4 weight', async () => {
        const signers = [0]

        const accounts = owners.map((owner, i) => ({
          weight: weights[i],
          owner: signers.includes(i) ? owner : owner.address
        }))

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
      })
      it('Should reject signed message with (0)/4 weight', async () => {
        const accounts = owners.map((owner, i) => ({
          weight: weights[i],
          owner: owner.address
        }))

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
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

        const tx = multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
        await expect(tx).to.be.rejectedWith('ModuleCalls#execute: INVALID_SIGNATURE')
      })
    })
  })
  describe('Gas limit', () => {
    let gasBurner

    before(async () => {
      gasBurner = (await GasBurnerMockArtifact.new()) as GasBurnerMock
    })

    it('Should forward the defined amount of gas', async () => {
      const gas = 10000

      const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: gas,
        target: gasBurner.address,
        value: ethers.constants.Zero,
        data: gasBurner.contract.methods.burnGas(0).encodeABI()
      }

      const tx = (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)) as any
      const reported = web3.utils.toBN(tx.receipt.rawLogs.slice(-2)[0].data)
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
          data: gasBurner.contract.methods.burnGas(8000).encodeABI()
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: gasB,
          target: gasBurner.address,
          value: ethers.constants.Zero,
          data: gasBurner.contract.methods.burnGas(340000).encodeABI()
        }
      ]

      const tx = (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)) as any

      const reportedB = web3.utils.toBN(tx.receipt.rawLogs.slice(-2)[0].data)
      const reportedA = web3.utils.toBN(tx.receipt.rawLogs.slice(-4)[0].data)

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
        data: gasBurner.contract.methods.burnGas(11000).encodeABI()
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
        data: gasBurner.contract.methods.burnGas(200000).encodeABI()
      }

      const tx = (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)) as any
      const log = tx.receipt.logs.pop()
      expect(log.event).to.be.equal('TxFailed')
    })
    it('Should continue execution if optional call runs out of gas', async () => {
      const gas = 10000

      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      const valA = 9512358833
      const valB = web3.utils.randomHex(1600)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: gas,
          target: gasBurner.address,
          value: ethers.constants.Zero,
          data: gasBurner.contract.methods.burnGas(200000).encodeABI()
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
        }
      ]

      const tx = (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)) as any
      const log = tx.receipt.logs.slice(-1)[0]
      expect(log.event).to.be.equal('TxFailed')
      expect(await callReceiver.lastValA()).to.eq.BN(valA)
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
        data: gasBurner.contract.methods.burnGas(0).encodeABI()
      }

      const signed = await multiSignMetaTransactions(wallet, [{ weight: 1, owner: owner }], 1, [transaction], networkId, 0)

      const tx = wallet.execute([transaction], 0, signed, { gas: 250000 })
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
          data: wallet.contract.methods.createContract(deployCode).encodeABI()
        }
      ]

      const tx = (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)) as any
      const log = tx.receipt.logs.find(l => l.event === 'CreatedContract')

      expect(log.event).to.equal('CreatedContract')

      const deployed = (await CallReceiverMockArtifact.at(log.args._contract)) as CallReceiverMock
      await deployed.testCall(12345, '0x552299')

      expect(await deployed.lastValA()).to.eq.BN(12345)
      expect(await deployed.lastValB()).to.equal('0x552299')
    })
    it('Should create a contract with value', async () => {
      const deployCode = CallReceiverMockArtifact.bytecode

      await wallet.send(100, { from: accounts[0] })

      const transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: 99,
          data: wallet.contract.methods.createContract(deployCode).encodeABI()
        }
      ]

      const tx = (await signAndExecuteMetaTx(wallet, owner, transactions, networkId)) as any
      const log = tx.receipt.logs.find(l => l.event === 'CreatedContract')

      expect(await web3.eth.getBalance(log.args._contract)).to.eq.BN(99)
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
      const tx = (await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)) as any
      const log = tx.receipt.rawLogs[1]
      const txHash = ethers.utils.keccak256(encodeMetaTransactionsData(wallet.address, [transaction], networkId, 0))

      expect(log.topics.length).to.equal(0)
      expect(log.data).to.be.equal(txHash)
    })

    it('Should emit multiple TxExecuted events', async () => {
      const tx = (await signAndExecuteMetaTx(wallet, owner, [transaction, transaction], networkId)) as any
      const log1 = tx.receipt.rawLogs[1]
      const log2 = tx.receipt.rawLogs[2]

      const txHash = ethers.utils.keccak256(encodeMetaTransactionsData(wallet.address, [transaction, transaction], networkId, 0))

      expect(log1.topics.length).to.equal(0)
      expect(log1.data).to.be.equal(txHash)

      expect(log2.topics.length).to.equal(0)
      expect(log2.data).to.be.equal(txHash)
    })
  })
  describe('Internal bundles', () => {
    it('Should execute internal bundle', async () => {
      const callReceiver1 = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      const callReceiver2 = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      const expected1 = await web3.utils.randomHex(552)
      const expected2 = await web3.utils.randomHex(24)

      const bundle = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit.div(ethers.constants.Two),
          target: callReceiver1.address,
          value: ethers.constants.Zero,
          data: callReceiver1.contract.methods.testCall(11, expected1).encodeABI()
        },
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit.div(ethers.constants.Two),
          target: callReceiver2.address,
          value: ethers.constants.Zero,
          data: callReceiver1.contract.methods.testCall(12, expected2).encodeABI()
        }
      ]

      const transaction = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.selfExecute(bundle).encodeABI()
        }
      ]

      await signAndExecuteMetaTx(wallet, owner, transaction, networkId)

      expect(await callReceiver1.lastValA()).to.eq.BN(11)
      expect(await callReceiver2.lastValA()).to.eq.BN(12)

      expect(await callReceiver1.lastValB()).to.eq.BN(expected1)
      expect(await callReceiver2.lastValB()).to.eq.BN(expected2)
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

      const contracts = await Promise.all((data as any).flat().map(() => CallReceiverMockArtifact.new()))
      const expectedb = await Promise.all((data as any).flat().map(d => web3.utils.randomHex(d.b)))

      const bundles = data.map(bundle => {
        return bundle.map(obj => ({
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit.div(ethers.constants.Two),
          value: ethers.constants.Zero,
          target: (contracts[obj.i] as CallReceiverMock).address,
          data: (contracts[obj.i] as CallReceiverMock).contract.methods.testCall(obj.a, expectedb[obj.i]).encodeABI()
        }))
      })

      const transactions = bundles.map(bundle => ({
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.contract.methods.selfExecute(bundle).encodeABI()
      }))

      await signAndExecuteMetaTx(wallet, owner, transactions, networkId)

      const lastValsA = await Promise.all(contracts.map((c: CallReceiverMock) => c.lastValA()))
      const lastValsB = await Promise.all(contracts.map((c: CallReceiverMock) => c.lastValB()))

      lastValsA.forEach((val, i) => expect(val).to.eq.BN((data as any).flat()[i].a))
      lastValsB.forEach((val, i) => expect(val).to.equal(expectedb[i]))
    })
    it('Should execute nested internal bundles', async () => {
      const callReceiver1 = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      const callReceiver2 = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      const expected1 = await web3.utils.randomHex(552)
      const expected2 = await web3.utils.randomHex(24)

      const bundle = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit.div(4),
          target: callReceiver1.address,
          value: ethers.constants.Zero,
          data: callReceiver1.contract.methods.testCall(11, expected1).encodeABI()
        },
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit.div(4),
          target: callReceiver2.address,
          value: ethers.constants.Zero,
          data: callReceiver1.contract.methods.testCall(12, expected2).encodeABI()
        }
      ]

      const nestedBundle = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit.div(2),
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.selfExecute(bundle).encodeABI()
        }
      ]

      const transaction = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.selfExecute(nestedBundle).encodeABI()
        }
      ]

      await signAndExecuteMetaTx(wallet, owner, transaction, networkId)

      expect(await callReceiver1.lastValA()).to.eq.BN(11)
      expect(await callReceiver2.lastValA()).to.eq.BN(12)

      expect(await callReceiver1.lastValB()).to.eq.BN(expected1)
      expect(await callReceiver2.lastValB()).to.eq.BN(expected2)
    })
    it('Should revert bundle without reverting transaction', async () => {
      const callReceiver1 = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      const callReceiver2 = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      const callReceiver3 = (await CallReceiverMockArtifact.new()) as CallReceiverMock

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
          data: callReceiver1.contract.methods.testCall(11, expected1).encodeABI()
        },
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: ethers.BigNumber.from(100000),
          target: callReceiver2.address,
          value: ethers.constants.Zero,
          data: callReceiver2.contract.methods.testCall(12, expected2).encodeABI()
        },
        {
          // This transaction will revert
          // because Factory has no fallback
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.BigNumber.from(100000),
          target: factory.address,
          value: ethers.constants.Zero,
          data: callReceiver1.contract.methods.testCall(12, expected2).encodeABI()
        }
      ]

      const transaction = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.selfExecute(bundle).encodeABI()
        },
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: optimalGasLimit,
          target: callReceiver3.address,
          value: ethers.constants.Zero,
          data: callReceiver3.contract.methods.testCall(51, expected3).encodeABI()
        }
      ]

      const tx = await signAndExecuteMetaTx(wallet, owner, transaction, networkId)

      expect(await callReceiver1.lastValA()).to.eq.BN(0)
      expect(await callReceiver2.lastValA()).to.eq.BN(0)
      expect(await callReceiver3.lastValA()).to.eq.BN(51)

      expect(await callReceiver1.lastValB()).to.equal(null)
      expect(await callReceiver2.lastValB()).to.equal(null)
      expect(await callReceiver3.lastValB()).to.eq.BN(expected3)
    })
  })
})

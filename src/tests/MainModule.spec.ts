import * as ethers from 'ethers'
import { expect, ethSign, signMetaTransactions, RevertError, MetaAction } from './utils';

import { MainModule } from 'typings/contracts/MainModule'
import { Factory } from 'typings/contracts/Factory'
import { CallReceiverMock } from 'typings/contracts/CallReceiverMock'
import { ModuleMock } from 'typings/contracts/ModuleMock'

ethers.errors.setLogLevel("error")

const FactoryArtifact = artifacts.require('Factory')
const MainModuleArtifact = artifacts.require('MainModule')
const MainModuleDeployerArtifact = artifacts.require('MainModuleDeployer')
const CallReceiverMockArtifact = artifacts.require('CallReceiverMock')
const ModuleMockArtifact = artifacts.require('ModuleMock')

const web3 = (global as any).web3

contract('MainModule', (accounts: string[]) => {
  let factory
  let module

  let owner
  let wallet

  before(async () => {
    // Deploy wallet factory
    factory = await FactoryArtifact.new() as Factory
    // Deploy MainModule
    const tx = await (await MainModuleDeployerArtifact.new()).deploy(factory.address)
    module = await MainModuleArtifact.at(tx.logs[0].args._module) as MainModule
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    const salt = web3.utils.padLeft(owner.address, 64)
    await factory.deploy(module.address, salt)
    wallet = await MainModuleArtifact.at(await factory.addressOf(module.address, salt)) as MainModule
  })

  describe('Authentication', () => {
    it('Should accept initial owner signature', async () => {
      const transaction = {
        action: MetaAction.external,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      const signature = await signMetaTransactions(wallet, owner, [transaction])

      await wallet.execute([transaction], signature)
    })
    it('Should reject non-owner signature', async () => {
      const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))

      const transaction = {
        action: MetaAction.external,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      const signature = await signMetaTransactions(wallet, impostor, [transaction])

      const tx = wallet.execute([transaction], signature)
      await expect(tx).to.be.rejectedWith(RevertError("MainModule#_signatureValidation: INVALID_SIGNATURE"))
    })
    describe('Nonce', () => {
      it('Should work with zero as initial nonce', async () => {
        const nonce = ethers.constants.Zero

        const transaction = {
          action: MetaAction.external,
          target: ethers.constants.AddressZero,
          value: ethers.constants.Zero,
          data: []
        }

        const signature = await signMetaTransactions(wallet, owner, [transaction], nonce)

        await wallet.execute([transaction], signature)
        expect(await wallet.nonce()).to.eq.BN(1)
      })
      it('Should emit NonceChange event', async () => {
        const nonce = ethers.constants.Zero

        const transaction = {
          action: MetaAction.external,
          target: ethers.constants.AddressZero,
          value: ethers.constants.Zero,
          data: []
        }

        const signature = await signMetaTransactions(wallet, owner, [transaction], nonce)

        const receipt = await wallet.execute([transaction], signature)
        const ev = receipt.logs.pop()
        expect(ev.event).to.be.eql('NonceChange')
        expect(ev.args.newNonce).to.eq.BN(1)
      })
      context('After a relayed transaction', () => {
        beforeEach(async () => {
          const nonce = ethers.constants.One

          const transaction = {
            action: MetaAction.external,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          const signature = await signMetaTransactions(wallet, owner, [transaction], nonce)

          await wallet.execute([transaction], signature)
        })
        it('Should accept next consecutive nonce', async () => {
          const nonce = ethers.constants.Two

          const transaction = {
            action: MetaAction.external,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          const signature = await signMetaTransactions(wallet, owner, [transaction], nonce)

          await wallet.execute([transaction], signature)
          expect(await wallet.nonce()).to.eq.BN(3)
        })
        it('Should accept next incremental nonce', async () => {
          const nonce = ethers.utils.bigNumberify(20)

          const transaction = {
            action: MetaAction.external,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          const signature = await signMetaTransactions(wallet, owner, [transaction], nonce)

          await wallet.execute([transaction], signature)
          expect(await wallet.nonce()).to.eq.BN(21)
        })
        it('Should accept maximum incremental nonce', async () => {
          const nonce = ethers.utils.bigNumberify(101)

          const transaction = {
            action: MetaAction.external,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          const signature = await signMetaTransactions(wallet, owner, [transaction], nonce)

          await wallet.execute([transaction], signature)
          expect(await wallet.nonce()).to.eq.BN(102)
        })
        it('Should fail if nonce did not change', async () => {
          const nonce = ethers.constants.One

          const transaction = {
            action: MetaAction.external,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          const signature = await signMetaTransactions(wallet, owner, [transaction], nonce)

          const tx = wallet.execute([transaction], signature)
          await expect(tx).to.be.rejectedWith(RevertError("MainModule#_auth: INVALID_NONCE"))
        })
        it('Should fail if nonce delta is above 100', async () => {
          const nonce = ethers.utils.bigNumberify(102)

          const transaction = {
            action: MetaAction.external,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          const signature = await signMetaTransactions(wallet, owner, [transaction], nonce)

          const tx = wallet.execute([transaction], signature)
          await expect(tx).to.be.rejectedWith(RevertError("MainModule#_auth: INVALID_NONCE"))
        })
        it('Should fail if nonce decreases', async () => {
          const nonce = ethers.constants.Zero

          const transaction = {
            action: MetaAction.external,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          const signature = await signMetaTransactions(wallet, owner, [transaction], nonce)

          const tx = wallet.execute([transaction], signature)
          await expect(tx).to.be.rejectedWith(RevertError("MainModule#_auth: INVALID_NONCE"))
        })
      })
    })
  })
  describe('Upgradeability', () => {
    it('Should update implementation', async () => {
      const newImplementation = await ModuleMockArtifact.new() as ModuleMock

      const transaction = {
        action: MetaAction.updateImp,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: ethers.utils.defaultAbiCoder.encode(['address'], [newImplementation.address])
      }

      const signature = await signMetaTransactions(wallet, owner, [transaction])

      await wallet.execute([transaction], signature)

      const mock_wallet = await ModuleMockArtifact.at(wallet.address) as ModuleMock
      expect((await mock_wallet.ping() as any).logs[0].event).to.equal("Pong")
    })
    it('Should fail to set implementation to address 0', async () => {
      const transaction = {
        action: MetaAction.updateImp,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: ethers.utils.defaultAbiCoder.encode(['address'], [ethers.constants.AddressZero])
      }

      const signature = await signMetaTransactions(wallet, owner, [transaction])

      const tx = wallet.execute([transaction], signature)
      await expect(tx).to.be.rejectedWith(RevertError("MainModule#_actionExecution: INVALID_IMPLEMENTATION"))
    })
  })
  describe("External calls", () => {
    it('Should perform call to contract', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transaction = {
        action: MetaAction.external,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }

      const signature = await signMetaTransactions(wallet, owner, [transaction])

      await wallet.execute([transaction], signature)
      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should return error message', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock
      await callReceiver.setRevertFlag(true)

      const transaction = {
        action: MetaAction.external,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(0, []).encodeABI()
      }

      const signature = await signMetaTransactions(wallet, owner, [transaction])

      const tx = wallet.execute([transaction], signature)
      await expect(tx).to.be.rejectedWith(RevertError("CallReceiverMock#testCall: REVERT_FLAG"))
    })
  })
  describe('Handle ETH', () => {
    it('Should receive ETH', async () => {
      await wallet.send(1, { from: accounts[0] })
    })
    it('Should transfer ETH', async () => {
      await wallet.send(100, { from: accounts[0] })

      const receiver = new ethers.Wallet(ethers.utils.randomBytes(32))

      const transaction = {
        action: MetaAction.external,
        target: receiver.address,
        value: 25,
        data: []
      }

      const signature = await signMetaTransactions(wallet, owner, [transaction])

      await wallet.execute([transaction], signature)
      expect(await web3.eth.getBalance(receiver.address)).to.eq.BN(25)
    })
    it('Should call payable function', async () => {
      await wallet.send(100, { from: accounts[0] })

      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock

      const valA = 63129
      const valB = web3.utils.randomHex(120)
      const value = 33

      const transaction = {
        action: MetaAction.external,
        target: callReceiver.address,
        value: value,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }

      const signature = await signMetaTransactions(wallet, owner, [transaction])

      await wallet.execute([transaction], signature)
      expect(await web3.eth.getBalance(callReceiver.address)).to.eq.BN(value)
      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
  })
})

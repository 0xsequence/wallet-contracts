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
        skipOnError: false,
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
        skipOnError: false,
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
          skipOnError: false,
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
          skipOnError: false,
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
            skipOnError: false,
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
            skipOnError: false,
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
            skipOnError: false,
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
            skipOnError: false,
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
            skipOnError: false,
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
            skipOnError: false,
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
            skipOnError: false,
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
        skipOnError: false,
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
        skipOnError: false,
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
        skipOnError: false,
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
        skipOnError: false,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(0, []).encodeABI()
      }

      const signature = await signMetaTransactions(wallet, owner, [transaction])

      const tx = wallet.execute([transaction], signature)
      await expect(tx).to.be.rejectedWith(RevertError("CallReceiverMock#testCall: REVERT_FLAG"))
    })
    describe('Batch transactions', () => {
      it('Should perform multiple calls to contracts in one tx', async () => {
        const callReceiver1 = await CallReceiverMockArtifact.new() as CallReceiverMock
        const callReceiver2 = await CallReceiverMockArtifact.new() as CallReceiverMock

        const val1A = 5423
        const val1B = web3.utils.randomHex(120)

        const val2A = 695412
        const val2B = web3.utils.randomHex(35)

        const transactions = [{
          action: MetaAction.external,
          skipOnError: false,
          target: callReceiver1.address,
          value: ethers.constants.Zero,
          data: callReceiver1.contract.methods.testCall(val1A, val1B).encodeABI()
        },{
          action: MetaAction.external,
          skipOnError: false,
          target: callReceiver2.address,
          value: ethers.constants.Zero,
          data: callReceiver2.contract.methods.testCall(val2A, val2B).encodeABI()
        }]

        const signature = await signMetaTransactions(wallet, owner, transactions)

        await wallet.execute(transactions, signature)
        expect(await callReceiver1.lastValA()).to.eq.BN(val1A)
        expect(await callReceiver1.lastValB()).to.equal(val1B)
        expect(await callReceiver2.lastValA()).to.eq.BN(val2A)
        expect(await callReceiver2.lastValB()).to.equal(val2B)
      })
      it('Should perform call a contract and transfer eth in one tx', async () => {
        const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock
        const receiver = new ethers.Wallet(ethers.utils.randomBytes(32))

        await wallet.send(100, { from: accounts[0] })

        const valA = 5423
        const valB = web3.utils.randomHex(120)

        const transactions = [{
          action: MetaAction.external,
          skipOnError: false,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
        }, {
          action: MetaAction.external,
          skipOnError: false,
          target: receiver.address,
          value: 26,
          data: []
        }]

        const signature = await signMetaTransactions(wallet, owner, transactions)

        await wallet.execute(transactions, signature)
        expect(await callReceiver.lastValA()).to.eq.BN(valA)
        expect(await callReceiver.lastValB()).to.equal(valB)
        expect(await web3.eth.getBalance(receiver.address)).to.eq.BN(26)
      })
      it('Should fail if one transaction fails', async () => {
        const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock
        const receiver = new ethers.Wallet(ethers.utils.randomBytes(32))

        await callReceiver.setRevertFlag(true)
        await wallet.send(100, { from: accounts[0] })

        const transactions = [{
          action: MetaAction.external,
          skipOnError: false,
          target: receiver.address,
          value: 26,
          data: []
        }, {
          action: MetaAction.external,
          skipOnError: false,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.contract.methods.testCall(0, []).encodeABI()
        }]

        const signature = await signMetaTransactions(wallet, owner, transactions)

        const tx = wallet.execute(transactions, signature)
        await expect(tx).to.be.rejectedWith('CallReceiverMock#testCall: REVERT_FLAG')
      })
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
        skipOnError: false,
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
        skipOnError: false,
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
  describe('Optional transactions', () => {
    it('Should skip a skipOnError transaction', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock
      await callReceiver.setRevertFlag(true)

      const data = callReceiver.contract.methods.testCall(0, []).encodeABI()

      const transaction = {
        action: MetaAction.external,
        skipOnError: true,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: data
      }

      const signature = await signMetaTransactions(wallet, owner, [transaction])

      const tx = await wallet.execute([transaction], signature)
      const event = tx.logs.pop()

      const reason = web3.eth.abi.decodeParameter('string', event.args._reason.slice(10))

      expect(reason).to.equal("CallReceiverMock#testCall: REVERT_FLAG")

      expect(event.args._index).to.eq.BN(0)
    })
    it('Should skip failing transaction within batch', async () => {
      const callReceiver1 = await CallReceiverMockArtifact.new() as CallReceiverMock
      const callReceiver2 = await CallReceiverMockArtifact.new() as CallReceiverMock

      await callReceiver1.setRevertFlag(true)

      const valA = 912341
      const valB = web3.utils.randomHex(30)

      const data1 = callReceiver1.contract.methods.testCall(0, []).encodeABI()
      const data2 = callReceiver2.contract.methods.testCall(valA, valB).encodeABI()

      const transactions = [{
        action: MetaAction.external,
        skipOnError: true,
        target: callReceiver1.address,
        value: ethers.constants.Zero,
        data: data1
      }, {
        action: MetaAction.external,
        skipOnError: false,
        target: callReceiver2.address,
        value: ethers.constants.Zero,
        data: data2
      }]

      const signature = await signMetaTransactions(wallet, owner, transactions)

      const tx = await wallet.execute(transactions, signature)
      const event = tx.logs.pop()

      const reason = web3.eth.abi.decodeParameter('string', event.args._reason.slice(10))

      expect(reason).to.equal("CallReceiverMock#testCall: REVERT_FLAG")

      expect(await callReceiver2.lastValA()).to.eq.BN(valA)
      expect(await callReceiver2.lastValB()).to.equal(valB)
    })
    it('Should skip multiple failing transactions within batch', async () => {
      const callReceiver1 = await CallReceiverMockArtifact.new() as CallReceiverMock
      const callReceiver2 = await CallReceiverMockArtifact.new() as CallReceiverMock

      await callReceiver1.setRevertFlag(true)

      const valA = 912341
      const valB = web3.utils.randomHex(30)

      const data1 = callReceiver1.contract.methods.testCall(0, []).encodeABI()
      const data2 = callReceiver2.contract.methods.testCall(valA, valB).encodeABI()

      const transactions = [{
        action: MetaAction.external,
        skipOnError: true,
        target: callReceiver1.address,
        value: ethers.constants.Zero,
        data: data1
      }, {
        action: MetaAction.external,
        skipOnError: true,
        target: callReceiver1.address,
        value: ethers.constants.Zero,
        data: data1
      }, {
        action: MetaAction.external,
        skipOnError: false,
        target: callReceiver2.address,
        value: ethers.constants.Zero,
        data: data2
      }]

      const signature = await signMetaTransactions(wallet, owner, transactions)

      const tx = await wallet.execute(transactions, signature)
      const event1 = tx.logs[1]
      const event2 = tx.logs[2]

      const reason1 = web3.eth.abi.decodeParameter('string', event1.args._reason.slice(10))
      const reason2 = web3.eth.abi.decodeParameter('string', event2.args._reason.slice(10))

      expect(reason1).to.equal("CallReceiverMock#testCall: REVERT_FLAG")
      expect(reason2).to.equal("CallReceiverMock#testCall: REVERT_FLAG")

      expect(event1.args._index).to.eq.BN(0)
      expect(event2.args._index).to.eq.BN(1)

      expect(await callReceiver2.lastValA()).to.eq.BN(valA)
      expect(await callReceiver2.lastValB()).to.equal(valB)
    })
    it('Should skip all failing transactions within batch', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock

      await callReceiver.setRevertFlag(true)

      const data = callReceiver.contract.methods.testCall(0, []).encodeABI()

      const transactions = [{
        action: MetaAction.external,
        skipOnError: true,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: data
      }, {
        action: MetaAction.external,
        skipOnError: true,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: data
      }]

      const signature = await signMetaTransactions(wallet, owner, transactions)

      const tx = await wallet.execute(transactions, signature)
      const event1 = tx.logs.pop()
      const event2 = tx.logs.pop()

      const reason1 = web3.eth.abi.decodeParameter('string', event1.args._reason.slice(10))
      const reason2 = web3.eth.abi.decodeParameter('string', event2.args._reason.slice(10))

      expect(reason1).to.equal("CallReceiverMock#testCall: REVERT_FLAG")
      expect(reason2).to.equal("CallReceiverMock#testCall: REVERT_FLAG")
    })
    it('Should skip skipOnError update implementation action', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock

      await callReceiver.setRevertFlag(true)

      const transactions = [{
        action: MetaAction.updateImp,
        skipOnError: true,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: ethers.utils.defaultAbiCoder.encode(['address'], [ethers.constants.AddressZero])
      }]

      const signature = await signMetaTransactions(wallet, owner, transactions)

      const tx = await wallet.execute(transactions, signature)
      const event = tx.logs.pop()

      const reason = web3.eth.abi.decodeParameter('string', event.args._reason.slice(10))

      expect(reason).to.equal("MainModule#_actionExecution: INVALID_IMPLEMENTATION")
      expect(await wallet.nonce()).to.eq.BN(1)
    })
    it('Should skip skipOnError invalid action', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock

      await callReceiver.setRevertFlag(true)

      const transactions = [{
        action: MetaAction.illegal,
        skipOnError: true,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }]

      const signature = await signMetaTransactions(wallet, owner, transactions)

      const tx = await wallet.execute(transactions, signature)
      const event = tx.logs.pop()

      const reason = web3.eth.abi.decodeParameter('string', event.args._reason.slice(10))

      expect(reason).to.equal("MainModule#_actionExecution: INVALID_ACTION")
    })
  })
})

import * as ethers from 'ethers'
import { expect, signAndExecuteMetaTx, nextNonce, signMetaTransactions, RevertError, ethSign, MetaTransactionsType, encodeMetaTransactionsData } from './utils';

import { MainModule } from 'typings/contracts/MainModule'
import { Factory } from 'typings/contracts/Factory'
import { CallReceiverMock } from 'typings/contracts/CallReceiverMock'
import { ModuleMock } from 'typings/contracts/ModuleMock'
import { HookCallerMock } from 'typings/contracts/HookCallerMock'
import { HookMock } from 'typings/contracts/HookMock'
import { DelegateCallMock } from 'typings/contracts/DelegateCallMock'

ethers.errors.setLogLevel("error")

const FactoryArtifact = artifacts.require('Factory')
const MainModuleArtifact = artifacts.require('MainModule')
const MainModuleDeployerArtifact = artifacts.require('MainModuleDeployer')
const CallReceiverMockArtifact = artifacts.require('CallReceiverMock')
const ModuleMockArtifact = artifacts.require('ModuleMock')
const HookCallerMockArtifact = artifacts.require('HookCallerMock')
const HookMockArtifact = artifacts.require('HookMock')
const DelegateCallMockArtifact = artifacts.require('DelegateCallMock')

const web3 = (global as any).web3

export type Configs = {
  threshold: number | string;
  keys: string[];
  weights: number[];
};


contract('MainModule', (accounts: string[]) => {
  let factory: Factory
  let module: MainModule

  let owner: ethers.Wallet
  let wallet: MainModule
  let packed_encoded_configs: string
  let configs: Configs

  const ConfigsType = `tuple(
    uint8 threshold,
    address[] keys,
    uint8[] weights
  )`

  before(async () => {
    // Deploy wallet factory
    factory = await FactoryArtifact.new()
    // Deploy MainModule
    const tx = await (await MainModuleDeployerArtifact.new()).deploy(factory.address)
    module = await MainModuleArtifact.at(tx.logs[0].args._module)
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    configs = {
      threshold: 1,
      keys: [owner.address],
      weights: [1]
    }
    packed_encoded_configs = ethers.utils.solidityPack(['uint8', 'uint8', 'uint8', 'address'], [1, 1, 1, owner.address])
    let encoded_configs = ethers.utils.defaultAbiCoder.encode([ConfigsType], [configs])
    const salt = ethers.utils.keccak256(encoded_configs)
    await factory.deploy(module.address, salt)
    wallet = await MainModuleArtifact.at(await factory.addressOf(module.address, salt))
  })

  describe('Authentication', () => {
    it.only('Should accept initial owner signature', async () => {
      const transaction = {
        delegateCall: false,
        skipOnError: false,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      let nonce = await nextNonce(wallet)
      const signature = await signMetaTransactions(wallet, owner, [transaction], nonce)
      let tx = await wallet.execute([transaction], [signature], packed_encoded_configs, nonce)

      //let tx = await signAndExecuteMetaTx(wallet, owner, [transaction])
      console.log(tx)
    })
    it('Should reject non-owner signature', async () => {
      const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))

      const transaction = {
        delegateCall: false,
        skipOnError: false,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      const tx = signAndExecuteMetaTx(wallet, impostor, [transaction])
      await expect(tx).to.be.rejectedWith(RevertError("MainModule#_signatureValidation: INVALID_SIGNATURE"))
    })
    describe('Nonce', () => {
      it('Should work with zero as initial nonce', async () => {
        const nonce = ethers.constants.Zero

        const transaction = {
          delegateCall: false,
          skipOnError: false,
          target: ethers.constants.AddressZero,
          value: ethers.constants.Zero,
          data: []
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction])
        expect(await wallet.nonce()).to.eq.BN(1)
      })
      it('Should emit NonceChange event', async () => {
        const nonce = ethers.constants.Zero

        const transaction = {
          delegateCall: false,
          skipOnError: false,
          target: ethers.constants.AddressZero,
          value: ethers.constants.Zero,
          data: []
        }

        const receipt = await signAndExecuteMetaTx(wallet, owner, [transaction]) as any
        const ev = receipt.logs.pop()
        expect(ev.event).to.be.eql('NonceChange')
        expect(ev.args.newNonce).to.eq.BN(1)
      })
      context('After a relayed transaction', () => {
        beforeEach(async () => {
          const nonce = ethers.constants.One

          const transaction = {
            delegateCall: false,
            skipOnError: false,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          await signAndExecuteMetaTx(wallet, owner, [transaction], nonce)
        })
        it('Should accept next consecutive nonce', async () => {
          const nonce = ethers.constants.Two

          const transaction = {
            delegateCall: false,
            skipOnError: false,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          await signAndExecuteMetaTx(wallet, owner, [transaction], nonce)
          expect(await wallet.nonce()).to.eq.BN(3)
        })
        it('Should accept next incremental nonce', async () => {
          const nonce = ethers.utils.bigNumberify(20)

          const transaction = {
            delegateCall: false,
            skipOnError: false,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          await signAndExecuteMetaTx(wallet, owner, [transaction], nonce)
          expect(await wallet.nonce()).to.eq.BN(21)
        })
        it('Should accept maximum incremental nonce', async () => {
          const nonce = ethers.utils.bigNumberify(101)

          const transaction = {
            delegateCall: false,
            skipOnError: false,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          await signAndExecuteMetaTx(wallet, owner, [transaction], nonce)
          expect(await wallet.nonce()).to.eq.BN(102)
        })
        it('Should fail if nonce did not change', async () => {
          const nonce = ethers.constants.One

          const transaction = {
            delegateCall: false,
            skipOnError: false,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          const tx = signAndExecuteMetaTx(wallet, owner, [transaction], nonce)
          await expect(tx).to.be.rejectedWith(RevertError("MainModule#_auth: INVALID_NONCE"))
        })
        it('Should fail if nonce delta is above 100', async () => {
          const nonce = ethers.utils.bigNumberify(102)

          const transaction = {
            delegateCall: false,
            skipOnError: false,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          const tx = signAndExecuteMetaTx(wallet, owner, [transaction], nonce)
          await expect(tx).to.be.rejectedWith(RevertError("MainModule#_auth: INVALID_NONCE"))
        })
        it('Should fail if nonce decreases', async () => {
          const nonce = ethers.constants.Zero

          const transaction = {
            delegateCall: false,
            skipOnError: false,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }

          const tx = signAndExecuteMetaTx(wallet, owner, [transaction], nonce)
          await expect(tx).to.be.rejectedWith(RevertError("MainModule#_auth: INVALID_NONCE"))
        })
      })
    })
  })
  describe('Upgradeability', () => {
    it('Should update implementation', async () => {
      const newImplementation = await ModuleMockArtifact.new() as ModuleMock

      const transaction = {
        delegateCall: false,
        skipOnError: false,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.contract.methods.updateImplementation(newImplementation.address).encodeABI()
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction])

      const mock_wallet = await ModuleMockArtifact.at(wallet.address) as ModuleMock
      expect((await mock_wallet.ping() as any).logs[0].event).to.equal("Pong")
    })
    it('Should fail to set implementation to address 0', async () => {
      const transaction = {
        delegateCall: false,
        skipOnError: false,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.contract.methods.updateImplementation(ethers.constants.AddressZero).encodeABI()
      }

      const tx = signAndExecuteMetaTx(wallet, owner, [transaction])
      await expect(tx).to.be.rejectedWith(RevertError("ModuleUpdate#updateImplementation: INVALID_IMPLEMENTATION"))
    })
  })
  describe("External calls", () => {
    it('Should perform call to contract', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transaction = {
        delegateCall: false,
        skipOnError: false,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction])
      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should return error message', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock
      await callReceiver.setRevertFlag(true)

      const transaction = {
        delegateCall: false,
        skipOnError: false,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(0, []).encodeABI()
      }

      const tx = signAndExecuteMetaTx(wallet, owner, [transaction])
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
          delegateCall: false,
          skipOnError: false,
          target: callReceiver1.address,
          value: ethers.constants.Zero,
          data: callReceiver1.contract.methods.testCall(val1A, val1B).encodeABI()
        },{
          delegateCall: false,
          skipOnError: false,
          target: callReceiver2.address,
          value: ethers.constants.Zero,
          data: callReceiver2.contract.methods.testCall(val2A, val2B).encodeABI()
        }]

        await signAndExecuteMetaTx(wallet, owner, transactions)
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
          delegateCall: false,
          skipOnError: false,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
        }, {
          delegateCall: false,
          skipOnError: false,
          target: receiver.address,
          value: 26,
          data: []
        }]

        await signAndExecuteMetaTx(wallet, owner, transactions)
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
          delegateCall: false,
          skipOnError: false,
          target: receiver.address,
          value: 26,
          data: []
        }, {
          delegateCall: false,
          skipOnError: false,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.contract.methods.testCall(0, []).encodeABI()
        }]

        const tx = signAndExecuteMetaTx(wallet, owner, transactions)
        await expect(tx).to.be.rejectedWith('CallReceiverMock#testCall: REVERT_FLAG')
      })
    })
  })
  describe('Delegate calls', () => {
    let module
    beforeEach(async () => {
      module = await DelegateCallMockArtifact.new() as DelegateCallMock
    })
    it('Should delegate call to module', async () => {
      const transaction1 = {
        delegateCall: true,
        skipOnError: false,
        target: module.address,
        value: 0,
        data: module.contract.methods.write(11, 45).encodeABI()
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction1])

      const transaction2 = {
        delegateCall: true,
        skipOnError: false,
        target: module.address,
        value: 0,
        data: module.contract.methods.read(11).encodeABI()
      }

      const tx = await signAndExecuteMetaTx(wallet, owner, [transaction2]) as any
      const val = web3.utils.toBN(tx.receipt.rawLogs.pop().data)
      expect(val).to.eq.BN(45)
    })
    context('on delegate call revert', () => {
      beforeEach(async () => {
        const transaction = {
          delegateCall: true,
          skipOnError: false,
          target: module.address,
          value: 0,
          data: module.contract.methods.setRevertFlag(true).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction])
      })
      it('Should pass if delegate call is optional', async () => {  
        const transaction = {
          delegateCall: true,
          skipOnError: true,
          target: module.address,
          value: 0,
          data: module.contract.methods.write(11, 45).encodeABI()
        }
  
        await signAndExecuteMetaTx(wallet, owner, [transaction])
      })
      it('Should fail if delegate call fails', async () => {
        const transaction = {
          delegateCall: true,
          skipOnError: false,
          target: module.address,
          value: 0,
          data: module.contract.methods.write(11, 45).encodeABI()
        }
  
        const tx = signAndExecuteMetaTx(wallet, owner, [transaction])
        await expect(tx).to.be.rejectedWith('DelegateCallMock#write: REVERT_FLAG')
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
        delegateCall: false,
        skipOnError: false,
        target: receiver.address,
        value: 25,
        data: []
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction])
      expect(await web3.eth.getBalance(receiver.address)).to.eq.BN(25)
    })
    it('Should call payable function', async () => {
      await wallet.send(100, { from: accounts[0] })

      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock

      const valA = 63129
      const valB = web3.utils.randomHex(120)
      const value = 33

      const transaction = {
        delegateCall: false,
        skipOnError: false,
        target: callReceiver.address,
        value: value,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }

      await signAndExecuteMetaTx(wallet, owner, [transaction])
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
        delegateCall: false,
        skipOnError: true,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: data
      }

      const tx = await signAndExecuteMetaTx(wallet, owner, [transaction]) as any
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
        delegateCall: false,
        skipOnError: true,
        target: callReceiver1.address,
        value: ethers.constants.Zero,
        data: data1
      }, {
        delegateCall: false,
        skipOnError: false,
        target: callReceiver2.address,
        value: ethers.constants.Zero,
        data: data2
      }]

      const tx = await signAndExecuteMetaTx(wallet, owner, transactions) as any
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
        delegateCall: false,
        skipOnError: true,
        target: callReceiver1.address,
        value: ethers.constants.Zero,
        data: data1
      }, {
        delegateCall: false,
        skipOnError: true,
        target: callReceiver1.address,
        value: ethers.constants.Zero,
        data: data1
      }, {
        delegateCall: false,
        skipOnError: false,
        target: callReceiver2.address,
        value: ethers.constants.Zero,
        data: data2
      }]

      const tx = await signAndExecuteMetaTx(wallet, owner, transactions) as any
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
        delegateCall: false,
        skipOnError: true,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: data
      }, {
        delegateCall: false,
        skipOnError: true,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: data
      }]

      const tx = await signAndExecuteMetaTx(wallet, owner, transactions) as any
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
        delegateCall: false,
        skipOnError: true,
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.contract.methods.updateImplementation(ethers.constants.AddressZero).encodeABI()
      }]

      const tx = await signAndExecuteMetaTx(wallet, owner, transactions) as any
      const event = tx.logs.pop()

      const reason = web3.eth.abi.decodeParameter('string', event.args._reason.slice(10))

      expect(reason).to.equal("ModuleUpdate#updateImplementation: INVALID_IMPLEMENTATION")
      expect(await wallet.nonce()).to.eq.BN(1)
    })
  })
  describe('Hooks', () => {
    let hookMock
    before(async () => {
      hookMock = await HookCallerMockArtifact.new() as HookCallerMock
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
        message = ethers.utils.defaultAbiCoder.encode(
          ['address', 'bytes'],
          [wallet.address, data]
        )
        hash = ethers.utils.keccak256(message)
      })
      it('Should validate arbitrary signed data', async () => {
        const signature = await ethSign(owner, message)
        await hookMock.callERC1271isValidSignatureData(
          wallet.address,
          data,
          signature
        )
      })
      it('Should validate arbitrary signed hash', async () => {
        const signature = await ethSign(owner, message)
        await hookMock.callERC1271isValidSignatureHash(
          wallet.address,
          hash,
          signature
        )
      })
      it('Should reject data signed by non-owner', async () => {
        const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
        const signature = await ethSign(impostor, message)
        const tx = hookMock.callERC1271isValidSignatureData(
          wallet.address,
          data,
          signature
        )
        expect(tx).to.be.rejectedWith("HookCallerMock#callERC1271isValidSignatureData: INVALID_RETURN")
      })
      it('Should reject hash signed by non-owner', async () => {
        const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))
        const signature = await ethSign(impostor, message)
        const tx = hookMock.callERC1271isValidSignatureHash(
          wallet.address,
          hash,
          signature
        )
        expect(tx).to.be.rejectedWith("HookCallerMock#callERC1271isValidSignatureHash: INVALID_RETURN")
      })
    })
    describe('External hooks', () => {
      let hookMock
      before(async () => {
        hookMock = await HookMockArtifact.new() as HookMock
      })
      it('Should forward call to external hook', async () => {
        const selector = hookMock.abi.find((i) => i.name === 'onHookMockCall').signature
        const transaction = {
          delegateCall: false,
          skipOnError: false,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.addHook(selector, hookMock.address).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction])

        const walletHook = await HookMockArtifact.at(wallet.address) as HookMock
        expect(await walletHook.onHookMockCall(21)).to.eq.BN(42)
      })
      it('Should not forward call to deregistered hook', async () => {
        const selector = hookMock.abi.find((i) => i.name === 'onHookMockCall').signature
        const transaction1 = {
          delegateCall: false,
          skipOnError: false,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.addHook(selector, hookMock.address).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction1])

        const transaction2 = {
          delegateCall: false,
          skipOnError: false,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.removeHook(selector).encodeABI()
        }

        await signAndExecuteMetaTx(wallet, owner, [transaction2])

        const walletHook = await HookMockArtifact.at(wallet.address) as HookMock
        const tx = walletHook.onHookMockCall(21)
        await expect(tx).to.be.rejectedWith("Returned values aren't valid, did it run Out of Gas?")
      })
      it('Should pass calling a non registered hook', async () => {
        const selector = hookMock.abi.find((i) => i.name === 'onHookMockCall').signature
        const data = ethers.utils.defaultAbiCoder.encode(['bytes4'], [selector])
        await web3.eth.sendTransaction({ from: accounts[0], to: wallet.address, data: data })
      })
    })
  })
})

import * as ethers from 'ethers'
import { expect, ethSign, encodeMetaTransactionsData, RevertError, MetaAction } from './utils';
ethers.errors.setLogLevel("error")

const Factory = artifacts.require('Factory')
const MainModule = artifacts.require('MainModule')
const MainModuleDeployer = artifacts.require('MainModuleDeployer')
const CallReceiverMock = artifacts.require('CallReceiverMock')

const web3 = (global as any).web3

contract('MainModule', (accounts: string[]) => {
  let factory
  let module

  before(async () => {
    // Deploy wallet factory
    factory = await Factory.new()
    // Deploy MainModule
    const tx = await (await MainModuleDeployer.new()).deploy(factory.address)
    module = await MainModule.at(tx.logs[0].args._module)
  })

  describe('Authentication', () => {
    it('Should accept initial owner signature', async () => {
      const owner = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt = web3.utils.padLeft(owner.address, 64)
      await factory.deploy(module.address, salt)
      const wallet = await MainModule.at(await factory.addressOf(module.address, salt))

      const nonce = ethers.constants.One

      const transaction = {
        action: MetaAction.external,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      const transactionsData = encodeMetaTransactionsData(wallet.address, [transaction], nonce)

      const signature = ethers.utils.solidityPack(
        ['bytes', 'uint256', 'uint8'],
        [await ethSign(owner, transactionsData), nonce, '2']
      )

      await wallet.execute([transaction], signature)
    })
    it('Should reject non-owner signature', async () => {
      const owner = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt = web3.utils.padLeft(owner.address, 64)
      await factory.deploy(module.address, salt)
      const wallet = await MainModule.at(await factory.addressOf(module.address, salt))

      const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))

      const nonce = ethers.constants.One

      const transaction = {
        action: MetaAction.external,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      const transactionsData = encodeMetaTransactionsData(wallet.address, [transaction], nonce)

      const signature = ethers.utils.solidityPack(
        ['bytes', 'uint256', 'uint8'],
        [await ethSign(impostor, transactionsData), nonce, '2']
      )

      const tx = wallet.execute([transaction], signature)
      await expect(tx).to.be.rejectedWith(RevertError("MainModule#_signatureValidation: INVALID_SIGNATURE"))
    })
  })
  describe("External calls", () => {
    let wallet
    let owner
    beforeEach(async () => {
      owner = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt = web3.utils.padLeft(owner.address, 64)
      await factory.deploy(module.address, salt)
      wallet = await MainModule.at(await factory.addressOf(module.address, salt))
    })
    it('Should perform call to contract', async () => {
      const callReceiver = await CallReceiverMock.new()

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const nonce = ethers.constants.One

      const transaction = {
        action: MetaAction.external,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }

      const transactionsData = encodeMetaTransactionsData(wallet.address, [transaction], nonce)

      const signature = ethers.utils.solidityPack(
        ['bytes', 'uint256', 'uint8'],
        [await ethSign(owner, transactionsData), nonce, '2']
      )

      await wallet.execute([transaction], signature)
      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should return error message', async () => {
      const callReceiver = await CallReceiverMock.new()
      await callReceiver.setRevertFlag(true)

      const nonce = ethers.constants.One

      const transaction = {
        action: MetaAction.external,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(0, []).encodeABI()
      }

      const transactionsData = encodeMetaTransactionsData(wallet.address, [transaction], nonce)

      const signature = ethers.utils.solidityPack(
        ['bytes', 'uint256', 'uint8'],
        [await ethSign(owner, transactionsData), nonce, '2']
      )

      const tx = wallet.execute([transaction], signature)
      await expect(tx).to.be.rejectedWith(RevertError("CallReceiverMock#testCall: REVERT_FLAG"))
    })
  })
  describe('Handle ETH', () => {
    let wallet
    let owner
    beforeEach(async () => {
      owner = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt = web3.utils.padLeft(owner.address, 64)
      await factory.deploy(module.address, salt)
      wallet = await MainModule.at(await factory.addressOf(module.address, salt))
    })
    it('Should receive ETH', async () => {
      await wallet.send(1, { from: accounts[0] })
    })
    it('Should transfer ETH', async () => {
      await wallet.send(100, { from: accounts[0] })

      const receiver = new ethers.Wallet(ethers.utils.randomBytes(32))

      const nonce = ethers.constants.One

      const transaction = {
        action: MetaAction.external,
        target: receiver.address,
        value: 25,
        data: []
      }

      const transactionsData = encodeMetaTransactionsData(wallet.address, [transaction], nonce)

      const signature = ethers.utils.solidityPack(
        ['bytes', 'uint256', 'uint8'],
        [await ethSign(owner, transactionsData), nonce, '2']
      )

      await wallet.execute([transaction], signature)
      expect(await web3.eth.getBalance(receiver.address)).to.eq.BN(25)
    })
    it('Should call payable function', async () => {
      await wallet.send(100, { from: accounts[0] })

      const callReceiver = await CallReceiverMock.new()

      const valA = 63129
      const valB = web3.utils.randomHex(120)
      const value = 33

      const nonce = ethers.constants.One

      const transaction = {
        action: MetaAction.external,
        target: callReceiver.address,
        value: value,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }

      const transactionsData = encodeMetaTransactionsData(wallet.address, [transaction], nonce)

      const signature = ethers.utils.solidityPack(
        ['bytes', 'uint256', 'uint8'],
        [await ethSign(owner, transactionsData), nonce, '2']
      )

      await wallet.execute([transaction], signature)
      expect(await web3.eth.getBalance(callReceiver.address)).to.eq.BN(value)
      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
  })
})

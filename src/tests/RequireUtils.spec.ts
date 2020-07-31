import * as ethers from 'ethers'
import { expect, signAndExecuteMetaTx, RevertError, encodeImageHash, addressOf, encodeNonce } from './utils';

import { MainModule } from 'typings/contracts/MainModule'
import { Factory } from 'typings/contracts/Factory'
import { RequireUtils } from 'typings/contracts/RequireUtils'
import { CallReceiverMock } from 'typings/contracts/CallReceiverMock'
import { EtherSymbol } from 'ethers/constants';

ethers.errors.setLogLevel("error")

const FactoryArtifact = artifacts.require('Factory')
const MainModuleArtifact = artifacts.require('MainModule')
const RequireUtilsArtifact = artifacts.require('RequireUtils')
const CallReceiverMockArtifact = artifacts.require('CallReceiverMock')

const web3 = (global as any).web3

function now(): number {
  return Math.floor(Date.now() / 1000)
}

const optimalGasLimit = ethers.constants.Two.pow(21)

contract('Require utils', (accounts: string[]) => {
  let factory: Factory
  let module: MainModule
  let requireUtils: RequireUtils

  let owner: ethers.Wallet
  let wallet: MainModule

  let networkId: number

  before(async () => {
    // Deploy wallet factory
    factory = await FactoryArtifact.new()
    // Deploy MainModule
    module = await MainModuleArtifact.new(factory.address)
    // Get network ID
    networkId = process.env.NET_ID ? process.env.NET_ID : await web3.eth.net.getId()
    // Deploy expirable util
    requireUtils = await RequireUtilsArtifact.new()
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    await factory.deploy(module.address, salt)
    wallet = await MainModuleArtifact.at(addressOf(factory.address, module.address, salt)) as MainModule
  })
  describe('Require min-nonce', () => {
    const stubTxns = [{
      delegateCall: false,
      revertOnError: true,
      gasLimit: optimalGasLimit,
      target: ethers.constants.AddressZero,
      value: ethers.constants.Zero,
      data: "0x"
    }]

    it('Should pass nonce increased from self-wallet', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock
      await signAndExecuteMetaTx(wallet, owner, stubTxns, networkId)

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transactions = [{
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: requireUtils.address,
        value: ethers.constants.Zero,
        data: requireUtils.contract.methods.requireMinNonce(
          wallet.address,
          ethers.constants.Two
        ).encodeABI()
      }, {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }]

      await signAndExecuteMetaTx(wallet, owner, transactions, networkId)

      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should pass nonce increased from different wallet', async () => {
      const owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt2 = encodeImageHash(1, [{ weight: 1, address: owner2.address }])
      await factory.deploy(module.address, salt2)
      const wallet2 = await MainModuleArtifact.at(addressOf(factory.address, module.address, salt2)) as MainModule

      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock
      await signAndExecuteMetaTx(wallet2, owner2, stubTxns, networkId)

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transactions = [{
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: requireUtils.address,
        value: ethers.constants.Zero,
        data: requireUtils.contract.methods.requireMinNonce(
          wallet2.address,
          ethers.constants.One
        ).encodeABI()
      }, {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }]

      await signAndExecuteMetaTx(wallet, owner, transactions, networkId)

      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should fail if nonce is below required on different wallet', async () => {
      const owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt2 = encodeImageHash(1, [{ weight: 1, address: owner2.address }])
      await factory.deploy(module.address, salt2)
      const wallet2 = await MainModuleArtifact.at(addressOf(factory.address, module.address, salt2)) as MainModule

      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock
      await signAndExecuteMetaTx(wallet2, owner2, stubTxns, networkId)

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transactions = [{
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: requireUtils.address,
        value: ethers.constants.Zero,
        data: requireUtils.contract.methods.requireMinNonce(
          wallet2.address,
          ethers.constants.Two
        ).encodeABI()
      }, {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }]

      const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED'))
    })
    it('Should fail if nonce is below required on self-wallet on a different space', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock
      await signAndExecuteMetaTx(wallet, owner, stubTxns, networkId)

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transactions = [{
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: requireUtils.address,
        value: ethers.constants.Zero,
        data: requireUtils.contract.methods.requireMinNonce(
          wallet.address,
          encodeNonce(ethers.constants.Two, ethers.constants.One)
        ).encodeABI()
      }, {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }]

      const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED'))
    })
    it('Should fail if nonce is below required on self-wallet', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock
  
      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transactions = [{
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: requireUtils.address,
        value: ethers.constants.Zero,
        data: requireUtils.contract.methods.requireMinNonce(
          wallet.address,
          ethers.constants.Two
        ).encodeABI()
      }, {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }]
      const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED'))
    })
  })
  describe('Expirable transactions', () => {
    it('Should pass if non expired', async () => {
      await requireUtils.requireNonExpired(now() + 480)
    })
    it('Should fail if expired', async () => {
      const tx = requireUtils.requireNonExpired(now() - 1)
      await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#requireNonExpired: EXPIRED'))
    })
    it('Should pass bundle if non expired', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transactions = [{
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: requireUtils.address,
        value: ethers.constants.Zero,
        data: requireUtils.contract.methods.requireNonExpired(now() + 480).encodeABI()
      }, {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }]

      await signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should fail bundle if expired', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transactions = [{
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: requireUtils.address,
        value: ethers.constants.Zero,
        data: requireUtils.contract.methods.requireNonExpired(now() - 1).encodeABI()
      }, {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }]

      const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#requireNonExpired: EXPIRED'))
    })
  })
})

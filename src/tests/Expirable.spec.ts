import * as ethers from 'ethers'
import { expect, signAndExecuteMetaTx, RevertError, encodeImageHash, addressOf } from './utils';

import { MainModule } from 'typings/contracts/MainModule'
import { Factory } from 'typings/contracts/Factory'
import { ExpirableUtil } from 'typings/contracts/ExpirableUtil'
import { CallReceiverMock } from 'typings/contracts/CallReceiverMock'

ethers.errors.setLogLevel("error")

const FactoryArtifact = artifacts.require('Factory')
const MainModuleArtifact = artifacts.require('MainModule')
const ExpirableUtilArtifact = artifacts.require('ExpirableUtil')
const CallReceiverMockArtifact = artifacts.require('CallReceiverMock')

const web3 = (global as any).web3

function now(): number {
  return Math.floor(Date.now() / 1000)
}

contract('Expirable', (accounts: string[]) => {
  let factory: Factory
  let module: MainModule
  let expirableUtil: ExpirableUtil

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
    expirableUtil = await ExpirableUtilArtifact.new()
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    await factory.deploy(module.address, salt)
    wallet = await MainModuleArtifact.at(addressOf(factory.address, module.address, salt)) as MainModule
  })

  describe('Expirable transactions', () => {
    it('Should pass if non expired', async () => {
      await expirableUtil.requireNonExpired(now() + 240)
    })
    it('Should fail if expired', async () => {
      const tx = expirableUtil.requireNonExpired(now() - 1)
      await expect(tx).to.be.rejectedWith(RevertError('ExpirableUtil:requireNonExpired: EXPIRED'))
    })
    it('Should pass bundle if non expired', async () => {
      const callReceiver = await CallReceiverMockArtifact.new() as CallReceiverMock

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transactions = [{
        delegateCall: false,
        revertOnError: true,
        gasLimit: ethers.constants.MaxUint256,
        target: expirableUtil.address,
        value: ethers.constants.Zero,
        data: expirableUtil.contract.methods.requireNonExpired(now() + 240).encodeABI()
      }, {
        delegateCall: false,
        revertOnError: true,
        gasLimit: ethers.constants.MaxUint256,
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
        gasLimit: ethers.constants.MaxUint256,
        target: expirableUtil.address,
        value: ethers.constants.Zero,
        data: expirableUtil.contract.methods.requireNonExpired(now() - 1).encodeABI()
      }, {
        delegateCall: false,
        revertOnError: true,
        gasLimit: ethers.constants.MaxUint256,
        target: callReceiver.address,
        value: ethers.constants.Zero,
        data: callReceiver.contract.methods.testCall(valA, valB).encodeABI()
      }]

      const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      await expect(tx).to.be.rejectedWith(RevertError('ExpirableUtil:requireNonExpired: EXPIRED'))
    })
  })
})

import * as ethers from 'ethers'
import {
  expect,
  signAndExecuteMetaTx,
  RevertError,
  encodeImageHash,
  encodeNonce,
  addressOf,
} from './utils'

import {
  MainModule,
  MainModuleUpgradable,
  Factory,
  RequireUtils,
  SessionUtils,
  ReadGapNonceHook
} from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const FactoryArtifact = artifacts.require('Factory')
const MainModuleArtifact = artifacts.require('MainModule')
const MainModuleUpgradableArtifact = artifacts.require('MainModuleUpgradable')
const RequireUtilsArtifact = artifacts.require('RequireUtils')
const SessionUtilsArtifact = artifacts.require('SessionUtils')
const ReadGapNonceHookArtifact = artifacts.require('ReadGapNonceHook')

import { web3 } from 'hardhat'

contract('Session utils', () => {
  const SessionSpace = ethers.BigNumber.from("861879107978547650890364157709704413515112855535")

  let factory: Factory

  let mainModule: MainModule
  let mainModuleUpgradable: MainModuleUpgradable
  let requireUtils: RequireUtils
  let sessionUtils: SessionUtils
  let readGapNonceHook: ReadGapNonceHook

  let owner: ethers.Wallet
  let wallet: MainModule

  let networkId: number

  before(async () => {
    // Deploy wallet factory
    factory = (await FactoryArtifact.new())
    // Deploy MainModule
    mainModule = (await MainModuleArtifact.new(factory.address))
    mainModuleUpgradable = (await MainModuleUpgradableArtifact.new())
    // Get network ID
    networkId = process.env.NET_ID ? parseInt(process.env.NET_ID) : await web3.eth.net.getId()
    // Deploy RequireUtils
    requireUtils = await RequireUtilsArtifact.new(factory.address, mainModule.address)
    // Deploy session utils
    sessionUtils = await SessionUtilsArtifact.new()
    // Deploy read gap nonce hook
    readGapNonceHook = await ReadGapNonceHookArtifact.new()
  })

  beforeEach(async () => {
    // Create new signer
    owner = ethers.Wallet.createRandom()
    // Encode imageHash of wallet
    const imageHash = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    // Deploy wallet
    await factory.deploy(mainModule.address, imageHash)
    // Update wallet obj
    const addr = addressOf(factory.address, mainModule.address, imageHash)
    wallet = await MainModuleArtifact.at(addr)
  })

  // This is only used for testing, in production
  // we don't expect to register this hook
  // as it serves no purpose
  async function registerGapNonceHook(): Promise<ReadGapNonceHook> {
    const txs = [{
      target: wallet.address,
      data: wallet.contract.methods.addHook("0xcc63f2e2", readGapNonceHook.address).encodeABI(),
      revertOnError: true,
      delegateCall: false,
      value: ethers.constants.Zero,
      gasLimit: ethers.constants.AddressZero
    }]

    await signAndExecuteMetaTx(wallet, owner, txs, networkId)

    expect(await wallet.readHook("0xcc63f2e2")).to.equal(readGapNonceHook.address)
    return ReadGapNonceHookArtifact.at(wallet.address)
  }

  describe('Gap nonce', async () => {
    it('Should enforce regular nonce', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.contract.methods.requireSessionNonce(1).encodeABI(),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await signAndExecuteMetaTx(wallet, owner, txs, networkId)

      // Session space nonce should be zero
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.eq.BN(0)

      // Gap nonce should be one
      const readGapNonce = await registerGapNonceHook()
      const gapNonce = await readGapNonce.readGapNonce(SessionSpace)
      expect(gapNonce).to.eq.BN(1)
    })
    it('Should enforce nonce with gap', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.contract.methods.requireSessionNonce(3).encodeABI(),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await signAndExecuteMetaTx(wallet, owner, txs, networkId)

      // Session space nonce should be zero
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.eq.BN(0)

      // Gap nonce should be one
      const readGapNonce = await registerGapNonceHook()
      const gapNonce = await readGapNonce.readGapNonce(SessionSpace)
      expect(gapNonce).to.eq.BN(3)
    })
    it('Should enforce nonce with gap starting, starting in one', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.contract.methods.requireSessionNonce(1).encodeABI(),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await signAndExecuteMetaTx(wallet, owner, txs, networkId)

      const txs2 = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.contract.methods.requireSessionNonce(4).encodeABI(),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await signAndExecuteMetaTx(wallet, owner, txs2, networkId)

      // Session space nonce should be zero
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.eq.BN(0)

      // Gap nonce should be one
      const readGapNonce = await registerGapNonceHook()
      const gapNonce = await readGapNonce.readGapNonce(SessionSpace)
      expect(gapNonce).to.eq.BN(4)
    })
    it('Should reject transaction with gap nonce zero', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.contract.methods.requireSessionNonce(0).encodeABI(),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await expect(signAndExecuteMetaTx(wallet, owner, txs, networkId)).to.be.rejectedWith(RevertError('GapNonceUtils#_requireGapNonce: INVALID_NONCE'))
    })
    it('Should reject transaction with gap below current nonce', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.contract.methods.requireSessionNonce(10).encodeABI(),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await signAndExecuteMetaTx(wallet, owner, txs, networkId)

      const txs2 = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.contract.methods.requireSessionNonce(5).encodeABI(),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await expect(signAndExecuteMetaTx(wallet, owner, txs2, networkId)).to.be.rejectedWith(RevertError('GapNonceUtils#_requireGapNonce: INVALID_NONCE'))
    })
  })
  describe('Reset nonce', async () => {
    it('Should reset session space back to zero', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.contract.methods.requireSessionNonce(1).encodeABI(),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      const encodedNonce = encodeNonce(SessionSpace, 0)

      await signAndExecuteMetaTx(wallet, owner, txs, networkId, encodedNonce)

      // Session space nonce should be zero
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.eq.BN(0)

      // Gap nonce should be one
      const readGapNonce = await registerGapNonceHook()
      const gapNonce = await readGapNonce.readGapNonce(SessionSpace)
      expect(gapNonce).to.eq.BN(1)
    })
    it('Should increase the session nonce if not using the session util', async () => {
      const txs = [{
        target: ethers.Wallet.createRandom().address,
        delegateCall: true,
        revertOnError: true,
        data: [],
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      const encodedNonce = encodeNonce(SessionSpace, 0)
      await signAndExecuteMetaTx(wallet, owner, txs, networkId, encodedNonce)

      // Session space nonce should be one
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.eq.BN(1)
    })
    it('Should use the same nonce twice, but the different gap nonces', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.contract.methods.requireSessionNonce(1).encodeABI(),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      const encodedNonce = encodeNonce(SessionSpace, 0)
      await signAndExecuteMetaTx(wallet, owner, txs, networkId, encodedNonce)

      const txs2 = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.contract.methods.requireSessionNonce(2).encodeABI(),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      const encodedNonce2 = encodeNonce(SessionSpace, 0)
      await signAndExecuteMetaTx(wallet, owner, txs2, networkId, encodedNonce2)

      // Session space nonce should be zero
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.eq.BN(0)

      // Gap nonce should be two
      const readGapNonce = await registerGapNonceHook()
      const gapNonce = await readGapNonce.readGapNonce(SessionSpace)
      expect(gapNonce).to.eq.BN(2)
    })
  })
})
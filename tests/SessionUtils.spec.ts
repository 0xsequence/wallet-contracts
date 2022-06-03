import * as ethers from 'ethers'
import { ethers as hethers } from 'hardhat'

import {
  expect,
  signAndExecuteMetaTx,
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
  ReadGapNonceHook,
  Factory__factory,
  MainModule__factory,
  MainModuleUpgradable__factory,
  RequireUtils__factory,
  SessionUtils__factory,
  ReadGapNonceHook__factory
} from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

contract('Session utils', () => {
  const SessionSpace = ethers.BigNumber.from("861879107978547650890364157709704413515112855535")

  let factoryFactory: Factory__factory
  let mainModuleFactory: MainModule__factory
  let mainModuleUpgradableFactory: MainModuleUpgradable__factory
  let requireUtilsFactory: RequireUtils__factory
  let sessionUtilsFactory: SessionUtils__factory
  let readGapNonceHookFactory: ReadGapNonceHook__factory
  
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
    factoryFactory = await hethers.getContractFactory('Factory') as Factory__factory
    mainModuleFactory = await hethers.getContractFactory('MainModule') as MainModule__factory
    mainModuleUpgradableFactory = await hethers.getContractFactory('MainModuleUpgradable') as MainModuleUpgradable__factory
    requireUtilsFactory = await hethers.getContractFactory('RequireUtils') as RequireUtils__factory
    sessionUtilsFactory = await hethers.getContractFactory('SessionUtils') as SessionUtils__factory
    readGapNonceHookFactory = await hethers.getContractFactory('ReadGapNonceHook') as ReadGapNonceHook__factory

    // Deploy wallet factory
    factory = await factoryFactory.deploy()
    // Deploy MainModule
    mainModule = await mainModuleFactory.deploy(factory.address)
    mainModuleUpgradable = await mainModuleUpgradableFactory.deploy()
    // Get network ID
    networkId = process.env.NET_ID ? parseInt(process.env.NET_ID) : hethers.provider.network.chainId
    // Deploy RequireUtils
    requireUtils = await requireUtilsFactory.deploy(factory.address, mainModule.address)
    // Deploy session utils
    sessionUtils = await sessionUtilsFactory.deploy()
    // Deploy read gap nonce hook
    readGapNonceHook = await readGapNonceHookFactory.deploy()
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
    wallet = mainModuleFactory.attach(addr)
    // Update wallet
    const newWallet = mainModuleUpgradableFactory.attach(wallet.address)
    const migrateBundle = [
      {
        delegateCall: false,
        revertOnError: true,
        gasLimit: ethers.constants.Two.pow(18),
        target: wallet.address,
        value: ethers.constants.Zero,
        data: wallet.interface.encodeFunctionData('updateImplementation', [mainModuleUpgradable.address])
      },
      {
        delegateCall: false,
        revertOnError: true,
        gasLimit: ethers.constants.Two.pow(18),
        target: wallet.address,
        value: ethers.constants.Zero,
        data: newWallet.interface.encodeFunctionData('updateImageHash', [imageHash])
      }
    ]
    await signAndExecuteMetaTx(wallet, owner, migrateBundle, networkId)
  })

  // This is only used for testing, in production
  // we don't expect to register this hook
  // as it serves no purpose
  async function registerGapNonceHook(): Promise<ReadGapNonceHook> {
    const txs = [{
      target: wallet.address,
      data: wallet.interface.encodeFunctionData('addHook', ["0xcc63f2e2", readGapNonceHook.address]),
      revertOnError: true,
      delegateCall: false,
      value: ethers.constants.Zero,
      gasLimit: ethers.constants.AddressZero
    }]

    await signAndExecuteMetaTx(wallet, owner, txs, networkId)

    expect(await wallet.readHook("0xcc63f2e2")).to.equal(readGapNonceHook.address)
    return readGapNonceHookFactory.attach(wallet.address)
  }

  describe('Gap nonce', async () => {
    it('Should enforce regular nonce', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [1]),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await signAndExecuteMetaTx(wallet, owner, txs, networkId)

      // Session space nonce should be zero
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.equal(0)

      // Gap nonce should be one
      const readGapNonce = await registerGapNonceHook()
      const gapNonce = await readGapNonce.readGapNonce(SessionSpace)
      expect(gapNonce).to.equal(1)
    })
    it('Should enforce nonce with gap', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [3]),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await signAndExecuteMetaTx(wallet, owner, txs, networkId)

      // Session space nonce should be zero
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.equal(0)

      // Gap nonce should be one
      const readGapNonce = await registerGapNonceHook()
      const gapNonce = await readGapNonce.readGapNonce(SessionSpace)
      expect(gapNonce).to.equal(3)
    })
    it('Should enforce nonce with gap starting, starting in one', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [1]),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await signAndExecuteMetaTx(wallet, owner, txs, networkId)

      const txs2 = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [4]),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await signAndExecuteMetaTx(wallet, owner, txs2, networkId)

      // Session space nonce should be zero
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.equal(0)

      // Gap nonce should be one
      const readGapNonce = await registerGapNonceHook()
      const gapNonce = await readGapNonce.readGapNonce(SessionSpace)
      expect(gapNonce).to.equal(4)
    })
    it('Should reject transaction with gap nonce zero', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [0]),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await expect(signAndExecuteMetaTx(wallet, owner, txs, networkId)).to.be.rejectedWith('GapNonceUtils#_requireGapNonce: INVALID_NONCE')
    })
    it('Should reject transaction with gap below current nonce', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [10]),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await signAndExecuteMetaTx(wallet, owner, txs, networkId)

      const txs2 = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [5]),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      await expect(signAndExecuteMetaTx(wallet, owner, txs2, networkId)).to.be.rejectedWith('GapNonceUtils#_requireGapNonce: INVALID_NONCE')
    })
  })
  describe('Reset nonce', async () => {
    it('Should reset session space back to zero', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [1]),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      const encodedNonce = encodeNonce(SessionSpace, 0)

      await signAndExecuteMetaTx(wallet, owner, txs, networkId, encodedNonce)

      // Session space nonce should be zero
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.equal(0)

      // Gap nonce should be one
      const readGapNonce = await registerGapNonceHook()
      const gapNonce = await readGapNonce.readGapNonce(SessionSpace)
      expect(gapNonce).to.equal(1)
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
      expect(nonce).to.equal(1)
    })
    it('Should use the same nonce twice, but the different gap nonces', async () => {
      const txs = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [1]),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      const encodedNonce = encodeNonce(SessionSpace, 0)
      await signAndExecuteMetaTx(wallet, owner, txs, networkId, encodedNonce)

      const txs2 = [{
        target: sessionUtils.address,
        delegateCall: true,
        revertOnError: true,
        data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [2]),
        gasLimit: ethers.constants.Zero,
        value: ethers.constants.Zero
      }]

      const encodedNonce2 = encodeNonce(SessionSpace, 0)
      await signAndExecuteMetaTx(wallet, owner, txs2, networkId, encodedNonce2)

      // Session space nonce should be zero
      const nonce = await wallet.readNonce(SessionSpace)
      expect(nonce).to.equal(0)

      // Gap nonce should be two
      const readGapNonce = await registerGapNonceHook()
      const gapNonce = await readGapNonce.readGapNonce(SessionSpace)
      expect(gapNonce).to.equal(2)
    })
  })
  it('Should reject non-upgraded wallet', async () => {
    // Create new signer
    const owner = ethers.Wallet.createRandom()
    // Encode imageHash of wallet
    const imageHash = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    // Deploy wallet
    await factory.deploy(mainModule.address, imageHash)
    // Update wallet obj
    const addr = addressOf(factory.address, mainModule.address, imageHash)
    const wallet = mainModuleFactory.attach(addr)

    const txs = [{
      target: sessionUtils.address,
      delegateCall: true,
      revertOnError: true,
      data: sessionUtils.interface.encodeFunctionData('requireSessionNonce', [1]),
      gasLimit: ethers.constants.Zero,
      value: ethers.constants.Zero
    }]

    const tx = signAndExecuteMetaTx(wallet, owner, txs, networkId)
    await expect(tx).to.be.rejectedWith("SessionUtils#requireSessionNonce: WALLET_NOT_UPGRADED")
  })
})
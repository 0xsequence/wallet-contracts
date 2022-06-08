import { expect, expectToBeRejected } from './utils'
import { GuestModule, CallReceiverMock, HookCallerMock, GuestModule__factory, CallReceiverMock__factory, HookCallerMock__factory, MainModuleUpgradable__factory } from 'src/gen/typechain'
import { ethers as hethers } from 'hardhat'
import * as ethers from 'ethers'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)


contract('GuestModule', () => {
  let mainModuleUpgradableFactory: MainModuleUpgradable__factory
  let guestModuleFactory: GuestModule__factory
  let callReceiverFactory: CallReceiverMock__factory
  let hookMockFactory: HookCallerMock__factory

  let module: GuestModule
  let callReceiver: CallReceiverMock
  let hookMock: HookCallerMock

  describe('GuestModule wallet', () => {
    before(async () => {
      mainModuleUpgradableFactory = await hethers.getContractFactory('MainModuleUpgradable') as MainModuleUpgradable__factory
      guestModuleFactory = await hethers.getContractFactory('GuestModule') as GuestModule__factory
      callReceiverFactory = await hethers.getContractFactory('CallReceiverMock') as CallReceiverMock__factory
      hookMockFactory = await hethers.getContractFactory('HookCallerMock') as HookCallerMock__factory

      // Deploy wallet factory
      module = await guestModuleFactory.deploy()
      callReceiver = await callReceiverFactory.deploy()
      hookMock = await hookMockFactory.deploy()
    })

    let valA: ethers.BigNumber
    let valB: string

    let transactions: {
      delegateCall: boolean;
      revertOnError: boolean;
      gasLimit: ethers.BigNumberish;
      target: string;
      value: ethers.BigNumberish;
      data: ethers.BytesLike;
    }[]

    beforeEach(async () => {
      valA = ethers.BigNumber.from(ethers.utils.randomBytes(3))
      valB = ethers.utils.hexlify(ethers.utils.randomBytes(120))

      transactions = [
        {
          delegateCall: false,
          revertOnError: false,
          gasLimit: ethers.constants.Two.pow(20),
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]
    })

    it('Should accept transactions without signature', async () => {
      await module.execute(transactions, 0, [])

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should accept transactions on selfExecute', async () => {
      await module.selfExecute(transactions)

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should accept transactions with random signature', async () => {
      const signature = ethers.utils.randomBytes(96)

      await module.execute(transactions, 0, signature)

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should accept transactions with random nonce', async () => {
      const nonce = 9123891

      await module.execute(transactions, nonce, [])

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should revert on delegateCall transactions', async () => {
      const transactions = [
        {
          delegateCall: true,
          revertOnError: false,
          gasLimit: 1000000,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]

      const tx = module.selfExecute(transactions)
      await expectToBeRejected(tx, 'DelegateCallNotAllowed()')
    })
    it('Should not accept ETH', async () => {
      // const tx = module.send(1, { from: accounts[0] })
      const tx = hethers.provider.getSigner().sendTransaction({ value: 1, to: module.address })
      await expect(tx).to.be.rejected
    })
    it('Should not implement hooks', async () => {
      const tx = hookMock.callERC1155Received(module.address)
      await expect(tx).to.be.rejected
    })
    it('Should not be upgradeable', async () => {
      const mainModule = mainModuleUpgradableFactory.attach((await guestModuleFactory.deploy()).address)
      const newImageHash = ethers.utils.hexlify(ethers.utils.randomBytes(32))

      const migrateBundle = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.constants.Two.pow(18),
          target: module.address,
          value: ethers.constants.Zero,
          data: mainModule.interface.encodeFunctionData('updateImplementation', [mainModule.address])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.constants.Two.pow(18),
          target: module.address,
          value: ethers.constants.Zero,
          data: mainModule.interface.encodeFunctionData('updateImageHash', [newImageHash])
        }
      ]

      const migrateTransaction = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.constants.Two.pow(18),
          target: module.address,
          value: ethers.constants.Zero,
          data: mainModule.interface.encodeFunctionData('selfExecute', [migrateBundle])
        }
      ]

      const tx = module.selfExecute(migrateTransaction)
      await expect(tx).to.be.rejected
    })
  })
})

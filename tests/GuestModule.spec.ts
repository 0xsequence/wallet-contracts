import { ethers } from 'ethers'
import { expect, RevertError } from './utils'

import { GuestModule, CallReceiverMock, HookCallerMock, MainModuleUpgradable } from 'src/gen/typechain'

import { CallReceiverMock__factory, GuestModule__factory, HookCallerMock__factory, MainModuleUpgradable__factory } from '../src'

import { ethers as hardhat, web3 } from 'hardhat'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

contract('GuestModule', (accounts: string[]) => {
  let signer: ethers.Signer
  let guestModule: GuestModule
  let callReceiver: CallReceiverMock
  let hookMock: HookCallerMock

  describe('GuestModule wallet', () => {
    before(async () => {
      signer = (await hardhat.getSigners())[0]

      // Deploy
      guestModule = await (new GuestModule__factory()).connect(signer).deploy()
      callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()
      hookMock = await (new HookCallerMock__factory()).connect(signer).deploy()
    })

    let valA
    let valB
    let transactions

    beforeEach(async () => {
      valA = web3.utils.toBN(web3.utils.randomHex(3)).toNumber()
      valB = web3.utils.randomHex(120)

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
      await guestModule.execute(transactions, 0, [])

      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should accept transactions on selfExecute', async () => {
      await guestModule.selfExecute(transactions)

      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should accept transactions with random signature', async () => {
      const signature = web3.utils.randomHex(69)

      await guestModule.execute(transactions, 0, signature)

      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should accept transactions with random nonce', async () => {
      const nonce = 9123891

      await guestModule.execute(transactions, nonce, [])

      expect((await callReceiver.lastValA()).toNumber()).to.eq.BN(valA)
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

      const tx = guestModule.selfExecute(transactions, { gasLimit: 100_000 })
      await expect(tx).to.be.rejectedWith(RevertError('GuestModule#_executeGuest: delegateCall not allowed'))
    })
    // it('Should not accept ETH', async () => {
    //   const tx = guestModule.send(1, { from: accounts[0] })
    //   await expect(tx).to.be.rejected
    // })
    it('Should not implement hooks', async () => {
      const tx = hookMock.callERC1155Received(guestModule.address)
      await expect(tx).to.be.rejected
    })
    it('Should not be upgradeable', async () => {
      const mainModule = await (new MainModuleUpgradable__factory()).connect(signer).deploy()
      const newImageHash = web3.utils.randomHex(32)

      const migrateBundle = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.constants.Two.pow(18),
          target: guestModule.address,
          value: ethers.constants.Zero,
          data: mainModule.interface.encodeFunctionData('updateImplementation', [mainModule.address])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.constants.Two.pow(18),
          target: guestModule.address,
          value: ethers.constants.Zero,
          data: mainModule.interface.encodeFunctionData('updateImageHash', [newImageHash])
        }
      ]

      const migrateTransaction = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.constants.Two.pow(18),
          target: guestModule.address,
          value: ethers.constants.Zero,
          data: guestModule.interface.encodeFunctionData('selfExecute', [migrateBundle])
        }
      ]

      const tx = guestModule.selfExecute(migrateTransaction)
      await expect(tx).to.be.rejected
    })
  })
})

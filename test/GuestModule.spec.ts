import { expect, expectToBeRejected } from './utils'
import { ethers as hethers } from 'hardhat'
import * as ethers from 'ethers'
import { CallReceiverMock, ContractType, GuestModule, HookCallerMock, MainModule } from './utils/contracts'
import { applyTxDefaults, Transaction } from './utils/sequence'


contract('GuestModule', () => {
  let guestModule: ContractType<typeof GuestModule>
  let callReceiver: ContractType<typeof CallReceiverMock>
  let hookCallerMock: ContractType<typeof HookCallerMock>

  describe('GuestModule wallet', () => {
    before(async () => {
      guestModule = await GuestModule.deploy()
      callReceiver = await CallReceiverMock.deploy()
      hookCallerMock = await HookCallerMock.deploy()
    })

    let valA: ethers.BigNumber
    let valB: string

    let transactions: Transaction[]

    beforeEach(async () => {
      valA = ethers.BigNumber.from(ethers.utils.randomBytes(3))
      valB = ethers.utils.hexlify(ethers.utils.randomBytes(120))

      transactions = applyTxDefaults([{
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
      }])
    })

    it('Should accept transactions without signature', async () => {
      await guestModule.execute(transactions, 0, [])

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should accept transactions on selfExecute', async () => {
      await guestModule.selfExecute(transactions)

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should accept transactions with random signature', async () => {
      const signature = ethers.utils.randomBytes(96)

      await guestModule.execute(transactions, 0, signature)

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should accept transactions with random nonce', async () => {
      const nonce = 9123891

      await guestModule.execute(transactions, nonce, [])

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should revert on delegateCall transactions', async () => {
      const transactions = applyTxDefaults([{
        delegateCall: true
      }])

      const tx = guestModule.selfExecute(transactions)
      await expectToBeRejected(tx, 'DelegateCallNotAllowed(0)')
    })
    it('Should not accept ETH', async () => {
      const tx = hethers.provider.getSigner().sendTransaction({ value: 1, to: guestModule.address })
      await expect(tx).to.be.rejected
    })
    it('Should not implement hooks', async () => {
      const tx = hookCallerMock.callERC1155Received(guestModule.address)
      await expect(tx).to.be.rejected
    })
    it('Should not be upgradeable', async () => {
      const mainModule = await MainModule.attach(guestModule.address)
      const newImageHash = ethers.utils.hexlify(ethers.utils.randomBytes(32))

      const migrateBundle = applyTxDefaults([{
        target: mainModule.address,
        data: mainModule.interface.encodeFunctionData('updateImageHash', [newImageHash])
      }])

      const tx = guestModule.selfExecute(migrateBundle)
      await expect(tx).to.be.rejected
    })
  })
})

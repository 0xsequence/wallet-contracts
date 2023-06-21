import * as ethers from 'ethers'

import { ethers as hethers } from 'hardhat'
import { b, CHAIN_ID, encodeError, expect, expectStaticToBeRejected } from './utils'
import { CallReceiverMock, ContractType, MultiCallUtils } from './utils/contracts'
import { applyTxDefault, applyTxDefaults } from './utils/sequence'

contract('Multi call utils', (accounts: string[]) => {
  let multiCall: ContractType<typeof MultiCallUtils>
  let callReceiver: ContractType< typeof CallReceiverMock>

  before(async () => {
    multiCall = await MultiCallUtils.deploy()
    callReceiver = await CallReceiverMock.deploy()
  })

  beforeEach(async () => {
    await callReceiver.setRevertFlag(false)
  })

  describe('Call multiple contracts', () => {
    it('Should execute empty call', async () => {
      const res = await multiCall.callStatic.multiCall([])

      expect(res[0].length).to.equal(0)
      expect(res[1].length).to.equal(0)
    })
    it('Should execute single call', async () => {
      await callReceiver.testCall(5123, [])
      const res = await multiCall.callStatic.multiCall(applyTxDefaults([{
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('lastValA')
      }]))

      expect(res[0].length).to.equal(1)
      expect(res[1].length).to.equal(1)
      expect(res[0][0]).to.be.true
      expect(res[1][0]).to.be.equal(ethers.utils.defaultAbiCoder.encode(['uint256'], [5123]))
    })
    it('Should execute two calls', async () => {
      const bytes = ethers.utils.randomBytes(422)

      await callReceiver.testCall(55522, bytes)
      const res = await multiCall.callStatic.multiCall(applyTxDefaults([{
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('lastValA')
      }, {
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('lastValB')
      }]))

      expect(res[0].length).to.equal(2)
      expect(res[1].length).to.equal(2)
      expect(res[0][0]).to.be.true
      expect(res[1][0]).to.be.equal(ethers.utils.defaultAbiCoder.encode(['uint256'], [55522]))
      expect(res[0][1]).to.be.true
      expect(ethers.utils.defaultAbiCoder.decode(['bytes'], res[1][1])[0]).to.be.equal(ethers.utils.hexlify(bytes))
    })
    it('Should execute calls to multiple contracts', async () => {
      const callReceiver2 = await CallReceiverMock.deploy()
      const bytes = ethers.utils.hexlify(ethers.utils.randomBytes(21))

      await callReceiver.testCall(55522, bytes)
      await callReceiver2.testCall(66623, [])

      const res = await multiCall.callStatic.multiCall(applyTxDefaults([{
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('lastValA')
      }, {
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('lastValB')
      }, {
        revertOnError: false,
        target: callReceiver2.address,
        data: callReceiver2.interface.encodeFunctionData('lastValA')
      }]))

      expect(res[0].length).to.equal(3)
      expect(res[1].length).to.equal(3)
      expect(res[0][0]).to.be.true
      expect(res[1][0]).to.be.equal(ethers.utils.defaultAbiCoder.encode(['uint256'], [55522]))
      expect(res[0][1]).to.be.true
      expect(ethers.utils.defaultAbiCoder.decode(['bytes'], res[1][1])[0]).to.be.equal(bytes)
      expect(res[0][2]).to.be.true
      expect(res[1][2]).to.be.equal(ethers.utils.defaultAbiCoder.encode(['uint256'], [66623]))
    })
    it('Return other calls even if single call fails', async () => {
      const bytes = ethers.utils.randomBytes(422)

      await callReceiver.testCall(55522, bytes)
      await callReceiver.setRevertFlag(true)

      const res = await multiCall.callStatic.multiCall(applyTxDefaults([{
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('lastValA')
      }, {
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [111, bytes])
      }]))

      expect(res[0].length).to.equal(2)
      expect(res[1].length).to.equal(2)
      expect(res[0][0]).to.be.true
      expect(res[1][0]).to.be.equal(ethers.utils.defaultAbiCoder.encode(['uint256'], [55522]))
      expect(res[0][1]).to.be.false
    })
    it('Fail if call with revert on error fails', async () => {
      const bytes = ethers.utils.randomBytes(422)

      await callReceiver.testCall(55522, bytes)
      await callReceiver.setRevertFlag(true)

      const tx = multiCall.callStatic.multiCall(applyTxDefaults([{
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('lastValA')
      }, {
        revertOnError: true,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [111, bytes])
      }]))

      await expectStaticToBeRejected(tx, `CallReverted(uint256,bytes)`, 1, encodeError("CallReceiverMock#testCall: REVERT_FLAG"))
    })
    it('Fail if batch includes delegate call', async () => {
      const bytes = ethers.utils.randomBytes(422)

      await callReceiver.testCall(55522, bytes)

      const tx = multiCall.callStatic.multiCall(applyTxDefaults([{
        delegateCall: true,
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('lastValA')
      }, {
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [111, bytes])
      }]))

      await expectStaticToBeRejected(tx, `DelegateCallNotAllowed(uint256)`, 0)
    })
    it('Fail if not enough gas for call', async () => {
      const bytes = ethers.utils.randomBytes(422)

      await callReceiver.testCall(55522, bytes)

      const tx = multiCall.callStatic.multiCall(applyTxDefaults([{
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('lastValA')
      }, {
        revertOnError: false,
        target: callReceiver.address,
        data: callReceiver.interface.encodeFunctionData('testCall', [111, bytes]),
        gasLimit: b(2)
          .pow(256)
          .sub(b(1))
      }]))

      await expectStaticToBeRejected(tx, `NotEnoughGas(uint256,uint256,uint256)`, 1, b(2).pow(256).sub(b(1)), '*')
    })
    it('Should call globals', async () => {
      const i = multiCall.interface
      const emptyAccount = ethers.Wallet.createRandom().address

      await multiCall.callStatic.multiCall([])

      const lastBlock = await hethers.provider.getBlock('latest')

      const txs = [
        i.encodeFunctionData('callBlockhash', [lastBlock.number - 1]),
        i.encodeFunctionData('callCoinbase'),
        i.encodeFunctionData('callDifficulty'),
        i.encodeFunctionData('callGasLimit'),
        i.encodeFunctionData('callBlockNumber'),
        i.encodeFunctionData('callTimestamp'),
        i.encodeFunctionData('callGasLeft'),
        i.encodeFunctionData('callGasPrice'),
        i.encodeFunctionData('callOrigin'),
        i.encodeFunctionData('callBalanceOf', [accounts[0]]),
        i.encodeFunctionData('callBalanceOf', [emptyAccount]),
        i.encodeFunctionData('callCodeSize', [accounts[0]]),
        i.encodeFunctionData('callCodeSize', [callReceiver.address]),
        i.encodeFunctionData('callCode', [accounts[0]]),
        i.encodeFunctionData('callCode', [callReceiver.address]),
        i.encodeFunctionData('callCodeHash', [accounts[0]]),
        i.encodeFunctionData('callCodeHash', [callReceiver.address]),
        i.encodeFunctionData('callChainId')
      ].map(data => (applyTxDefault({
        revertOnError: false,
        target: multiCall.address,
        data
      })))

      const res = await multiCall.callStatic.multiCall(txs, { gasPrice: 1 })

      const emptyBytes32 = ethers.utils.defaultAbiCoder.encode(['uint256'], ['0'])

      expect(res[0].length).to.equal(txs.length)
      expect(res[1].length).to.equal(txs.length)

      // All calls must success
      expect(res[0].reduce((a: boolean, c: boolean) => a && c)).to.be.true

      expect(res[1][0]).to.not.equal(emptyBytes32, 'return block hash')

      if (!process.env.COVERAGE) {
        expect(res[1][1]).to.not.equal(emptyBytes32, 'return coinbase')
        expect(res[1][2]).to.not.equal(emptyBytes32, 'return difficulty')
      }

      expect(res[1][3]).to.not.equal(emptyBytes32)
      expect(res[1][4]).to.not.equal(emptyBytes32, 'return block number')
      expect(res[1][5]).to.not.equal(emptyBytes32, 'return timestamp')
      expect(res[1][6]).to.not.equal(emptyBytes32, 'return gas left')
      expect(ethers.BigNumber.from(res[1][7])).to.equal(1, 'return gas price')
      expect(res[1][8]).to.not.equal(emptyBytes32, 'return origin')
      expect(res[1][9]).to.not.equal(emptyBytes32, 'return balance of 0x')
      expect(res[1][10]).to.equal(emptyBytes32, 'return balance of empty account')
      expect(res[1][11]).to.equal(emptyBytes32, 'return code size of empty account')
      expect(res[1][12]).to.not.equal(emptyBytes32, 'return code size of contract')

      expect(ethers.utils.defaultAbiCoder.decode(['bytes'], res[1][13])[0]).to.equal('0x')

      const codeSize = ethers.utils.defaultAbiCoder.decode(['uint256'], res[1][12])[0]
      expect(ethers.utils.defaultAbiCoder.decode(['bytes'], res[1][14])[0].length).to.equal(
        2 + codeSize * 2,
        'return code of correct size'
      )

      expect(res[1][15]).to.not.equal(emptyBytes32)
      expect(res[1][16]).to.not.equal(emptyBytes32)

      expect(ethers.utils.defaultAbiCoder.decode(['uint256'], res[1][17])[0].toNumber()).to.equal(CHAIN_ID(), 'return chain id')
    })
  })
})

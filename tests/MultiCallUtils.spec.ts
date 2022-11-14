import { ethers as hardhat, web3 } from 'hardhat'
import { ethers } from 'ethers'
import { expect, b, RevertError } from './utils'

import { MultiCallUtils, CallReceiverMock, MultiCallUtils__factory, CallReceiverMock__factory } from '../src'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const CallReceiverMockArtifact = artifacts.require('CallReceiverMock')

contract('Multi call utils', (accounts: string[]) => {
  let signer: ethers.Signer
  let multiCall: MultiCallUtils
  let callReceiver: CallReceiverMock

  before(async () => {
    signer = (await hardhat.getSigners())[0]
    multiCall = await (new MultiCallUtils__factory()).connect(signer).deploy()
    callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()
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
      const res = await multiCall.callStatic.multiCall([
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('lastValA'),
          gasLimit: 0,
          value: 0
        }
      ])

      expect(res[0].length).to.equal(1)
      expect(res[1].length).to.equal(1)
      expect(res[0][0]).to.be.true
      expect(res[1][0]).to.be.equal(ethers.utils.defaultAbiCoder.encode(['uint256'], [5123]))
    })
    it('Should execute two calls', async () => {
      const bytes = ethers.utils.randomBytes(422)

      await callReceiver.testCall(55522, bytes)
      const res = await multiCall.callStatic.multiCall([
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('lastValA'),
          gasLimit: 0,
          value: 0
        },
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('lastValB'),
          gasLimit: 0,
          value: 0
        }
      ])

      expect(res[0].length).to.equal(2)
      expect(res[1].length).to.equal(2)
      expect(res[0][0]).to.be.true
      expect(res[1][0]).to.be.equal(ethers.utils.defaultAbiCoder.encode(['uint256'], [55522]))
      expect(res[0][1]).to.be.true
      expect(ethers.utils.defaultAbiCoder.decode(['bytes'], res[1][1])[0]).to.be.equal(ethers.utils.hexlify(bytes))
    })
    it('Should execute calls to multiple contracts', async () => {
      const callReceiver2 = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      const bytes = ethers.utils.hexlify(ethers.utils.randomBytes(21))

      await callReceiver.testCall(55522, bytes)
      await callReceiver2.testCall(66623, [])

      const res = await multiCall.callStatic.multiCall([
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('lastValA'),
          gasLimit: 0,
          value: 0
        },
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('lastValB'),
          gasLimit: 0,
          value: 0
        },
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver2.address,
          data: callReceiver.interface.encodeFunctionData('lastValA'),
          gasLimit: 0,
          value: 0
        }
      ])

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

      const res = await multiCall.callStatic.multiCall([
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('lastValA'),
          gasLimit: 0,
          value: 0
        },
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [111, bytes]),
          gasLimit: 0,
          value: 0
        }
      ])

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

      const tx = multiCall.callStatic.multiCall([
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('lastValA'),
          gasLimit: 0,
          value: 0
        },
        {
          delegateCall: false,
          revertOnError: true,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [111, bytes]),
          gasLimit: 0,
          value: 0
        }
      ])

      await expect(tx).to.be.rejectedWith(RevertError('MultiCallUtils#multiCall: CALL_REVERTED'))
    })
    it('Fail if batch includes delegate call', async () => {
      const bytes = ethers.utils.randomBytes(422)

      await callReceiver.testCall(55522, bytes)

      const tx = multiCall.callStatic.multiCall([
        {
          delegateCall: true,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('lastValA'),
          gasLimit: 0,
          value: 0
        },
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [111, bytes]),
          gasLimit: 0,
          value: 0
        }
      ])

      await expect(tx).to.be.rejectedWith(RevertError('MultiCallUtils#multiCall: delegateCall not allowed'))
    })
    it('Fail if not enough gas for call', async () => {
      const bytes = ethers.utils.randomBytes(422)

      await callReceiver.testCall(55522, bytes)

      const tx = multiCall.callStatic.multiCall([
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('lastValA'),
          gasLimit: 0,
          value: 0
        },
        {
          delegateCall: false,
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [111, bytes]),
          gasLimit: b(2)
            .pow(256)
            .sub(b(1)),
          value: 0
        }
      ])

      await expect(tx).to.be.rejectedWith(RevertError('MultiCallUtils#multiCall: NOT_ENOUGH_GAS'))
    })
    it('Should call globals', async () => {
      const emptyAccount = ethers.Wallet.createRandom().address

      await multiCall.callStatic.multiCall([])

      const lastBlock = await web3.eth.getBlock('latest')

      const txs = [
        ['callBlockhash', [lastBlock.number - 1]],
        ['callCoinbase', []],
        ['callDifficulty', []],
        ['callGasLimit', []],
        ['callBlockNumber', []],
        ['callTimestamp', []],
        ['callGasLeft', []],
        ['callGasPrice', []],
        ['callOrigin', []],
        ['callBalanceOf', [accounts[0]]],
        ['callBalanceOf', [emptyAccount]],
        ['callCodeSize', [accounts[0]]],
        ['callCodeSize', [callReceiver.address]],
        ['callCode', [accounts[0]]],
        ['callCode', [callReceiver.address]],
        ['callCodeHash', [accounts[0]]],
        ['callCodeHash', [callReceiver.address]],
        ['callChainId', []]
      ].map(method => ({
        delegateCall: false,
        revertOnError: false,
        target: multiCall.address,
        value: 0,
        gasLimit: 0,
        data: multiCall.interface.encodeFunctionData(method[0] as any, method[1] as any)
      }))

      const res = await multiCall.callStatic.multiCall(txs)

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
      // expect(res[1][7]).to.not.equal(emptyBytes32, 'return gas price')
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

      const chainId = process.env.NET_ID ? parseInt(process.env.NET_ID) : await web3.eth.net.getId()
      expect(ethers.utils.defaultAbiCoder.decode(['uint256'], res[1][17])[0].toNumber()).to.equal(chainId, 'return chain id')
    })
  })
})

import * as ethers from 'ethers'
import { expect } from './utils'

import { CallReceiverMock, ContractType, deploySequenceContext, GasEstimator, GuestModule, ModuleMock, SequenceContext, MainModuleGasEstimation, MainModule } from './utils/contracts'
import { applyTxDefaults, toSimplifiedConfig, Transaction } from './utils/sequence'
import { SequenceWallet } from './utils/wallet'


function txBaseCost(data: ethers.BytesLike): number {
  const bytes = ethers.utils.arrayify(data)
  return bytes.reduce((p, c) => c == 0 ? p.add(4) : p.add(16), ethers.constants.Zero).add(21000).toNumber()
}

contract('Estimate gas usage', () => {
  let context: SequenceContext

  let gasEstimator: ContractType<typeof GasEstimator>
  let callReceiver: ContractType< typeof CallReceiverMock>
  let guestModule: ContractType<typeof GuestModule>
  let moduleMock: ContractType<typeof ModuleMock>

  let wallet: SequenceWallet

  const bundleWithDeploy = (txData: string) => {
    return applyTxDefaults([{
      target: context.factory.address,
      data: context.factory.interface.encodeFunctionData('deploy', [context.mainModule.address, wallet.imageHash]),
    }, {
      target: wallet.address,
      data: txData
    }])
  }

  const estimate = (address: string, data: ethers.BytesLike) => ({ call: async () =>  {
    return gasEstimator.callStatic.estimate(address, data)
  }})

  const estimateGasUsage = async (txs: Partial<Transaction>[], wallet: SequenceWallet, deploy: boolean = false, nonce: ethers.BigNumberish = 0) => {
    const stubSignature = await SequenceWallet.detailedWallet(context, {
      threshold: wallet.config.threshold,
      signers: toSimplifiedConfig(wallet.config).signers.map(() => ethers.Wallet.createRandom())
    }).signMessage(ethers.utils.randomBytes(32))

    const txData = wallet.mainModule.interface.encodeFunctionData('execute', [applyTxDefaults(txs), nonce, stubSignature])
    if (!deploy) {
      const res = await estimate(wallet.address, txData).call()
      return res.gas.add(txBaseCost(txData)).toNumber()
    }

    const guestModuleData = guestModule.interface.encodeFunctionData('execute', [bundleWithDeploy(txData), 0, []])
    const res = await estimate(guestModule.address, guestModuleData).call()
    return res.gas.add(txBaseCost(txData)).toNumber()
  }

  const gasUsedFor = async (tx: Promise<ethers.ContractTransaction> | ethers.ContractTransaction) => {
    const receipt = await (await tx).wait()
    return ethers.BigNumber.from(receipt.gasUsed).toNumber()
  }

  before(async () => {
    context = await deploySequenceContext()

    // Deploy MainModuleGasEstimation (hardhat doesn't support overwrites, so we use this as the real module)
    context.mainModule = await MainModuleGasEstimation.deploy() as any as ContractType<typeof MainModule>

    gasEstimator = await GasEstimator.deploy()
    guestModule = await GuestModule.deploy()
    moduleMock = await ModuleMock.deploy()
  })

  beforeEach(async () => {
    wallet = SequenceWallet.basicWallet(context)
    callReceiver = await CallReceiverMock.deploy()
  })

  describe('Estimate gas of transactions', () => {
    describe('without wallet deployed', () => {
      it('Should estimate wallet deployment', async () => {
        wallet = SequenceWallet.basicWallet(context)
        const factoryData = context.factory.interface.encodeFunctionData('deploy', [context.mainModule.address, wallet.imageHash])

        const estimated = ethers.BigNumber.from((await estimate(context.factory.address, factoryData).call()).gas).toNumber()
        const realTx = await context.factory.deploy(context.mainModule.address, wallet.imageHash)
        expect(estimated + txBaseCost(factoryData)).to.approximately(await gasUsedFor(realTx), 5000)
      })

      it('Should estimate wallet deployment + upgrade', async () => {
        const transactions = [{
          target: wallet.address,
          data: wallet.mainModule.interface.encodeFunctionData('updateImplementation', [moduleMock.address])
        }]

        const estimated = await estimateGasUsage(transactions, wallet, true)

        const signature = await wallet.signTransactions(transactions, 0)
        const executeTxData = bundleWithDeploy(wallet.mainModule.interface.encodeFunctionData('execute', [applyTxDefaults(transactions), 0, signature]))
        const realTx = await guestModule.execute(executeTxData, 0, [])

        expect(estimated).to.approximately(await gasUsedFor(realTx), 5000)
      })

      it('Should estimate wallet deployment + upgrade + transaction', async () => {
        const transactions = [{
          target: wallet.address,
          data: wallet.mainModule.interface.encodeFunctionData('updateImplementation', [moduleMock.address])
        }, {
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
        }]

        const estimated = await estimateGasUsage(transactions, wallet, true)

        const signature = await wallet.signTransactions(transactions, 0)
        const executeTxData = bundleWithDeploy(wallet.mainModule.interface.encodeFunctionData('execute', [applyTxDefaults(transactions), 0, signature]))
        const realTx = await guestModule.execute(executeTxData, 0, [])

        expect(estimated).to.approximately(await gasUsedFor(realTx), 5000)

        expect(await callReceiver.lastValA()).to.equal(1)
      })

      it('Should estimate wallet deployment + upgrade + failed transaction', async () => {
        await callReceiver.setRevertFlag(true)

        const transactions = [{
          target: wallet.address,
          data: wallet.mainModule.interface.encodeFunctionData('updateImplementation', [moduleMock.address])
        }, {
          revertOnError: false,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
        }]

        const estimated = await estimateGasUsage(transactions, wallet, true)

        const signature = await wallet.signTransactions(transactions, 0)
        const executeTxData = bundleWithDeploy(wallet.mainModule.interface.encodeFunctionData('execute', [applyTxDefaults(transactions), 0, signature]))
        const realTx = await guestModule.execute(executeTxData, 0, [])

        expect(estimated).to.approximately(await gasUsedFor(realTx), 5000)
      })

      it('Should estimate wallet deployment + upgrade + fixed gas transaction', async () => {
        const transactions = [{
          target: wallet.address,
          data: wallet.mainModule.interface.encodeFunctionData('updateImplementation', [moduleMock.address])
        }, {
          revertOnError: false,
          gasLimit: 900000,
          target: callReceiver.address,
          data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
        }]

        const estimated = await estimateGasUsage(transactions, wallet, true)

        const signature = await wallet.signTransactions(transactions, 0)
        const executeTxData = bundleWithDeploy(wallet.mainModule.interface.encodeFunctionData('execute', [applyTxDefaults(transactions), 0, signature]))
        const realTx = await guestModule.execute(executeTxData, 0, [])

        expect(estimated).to.approximately(await gasUsedFor(realTx), 5000)
      })
    })

    ;([{
      name: "single signer",
      signers: 1
    }, {
      name: "many signers",
      signers: 32
    }]).map((o) => {
      describe(`with wallet deployed and ${o.name}`, () => {
        beforeEach(async () => {
          wallet = SequenceWallet.basicWallet(context, { signing: o.signers })
          await wallet.deploy()
        })

        it('Should estimate single transaction', async () => {
          const transactions = [{
            target: callReceiver.address,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
          }]

          const estimated = await estimateGasUsage(transactions, wallet)
          const gasUsed = await wallet.sendTransactions(transactions).then((t) => t.wait()).then((r) => r.gasUsed.toNumber())

          expect(estimated).to.approximately(gasUsed, 5000)
        })

        it('Should estimate multiple transactions', async () => {
          const transactions = [{
            target: callReceiver.address,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
          }, {
            target: callReceiver.address,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))])
          }]

          const estimated = await estimateGasUsage(transactions, wallet)
          const gasUsed = await wallet.sendTransactions(transactions).then((t) => t.wait()).then((r) => r.gasUsed.toNumber())

          // TODO: The estimator overEstimates the gas usage due to the gas refund
          expect(gasUsed).to.be.below(estimated)
        })

        it('Should estimate multiple transactions with bad nonce', async () => {
          const transactions = [{
            target: callReceiver.address,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
          }, {
            target: callReceiver.address,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))])
          }]

          const estimated = await estimateGasUsage(transactions, wallet, false, 999999999)
          const gasUsed = await wallet.sendTransactions(transactions).then((t) => t.wait()).then((r) => r.gasUsed.toNumber())

          // TODO: The estimator overEstimates the gas usage due to the gas refund
          expect(gasUsed).to.be.below(estimated)
        })

        it('Should estimate multiple transactions with failing transactions', async () => {
          const altCallReceiver = await CallReceiverMock.deploy()
          await altCallReceiver.setRevertFlag(true)

          const transactions = [{
            target: callReceiver.address,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
          }, {
            target: callReceiver.address,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))])
          }, {
            revertOnError: false,
            target: altCallReceiver.address,
            data: altCallReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(229))])
          }]

          const estimated = await estimateGasUsage(transactions, wallet)
          const gasUsed = await wallet.sendTransactions(transactions).then((t) => t.wait()).then((r) => r.gasUsed.toNumber())

          // TODO: The estimator overEstimates the gas usage due to the gas refund
          expect(gasUsed).to.be.below(estimated)
        })

        it('Should estimate multiple transactions with failing transactions and fixed gas limits', async () => {
          const altCallReceiver = await CallReceiverMock.deploy()
          await altCallReceiver.setRevertFlag(true)

          const transactions = [{
            target: callReceiver.address,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
          }, {
            gasLimit: 90000,
            target: callReceiver.address,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(12))])
          }, {
            revertOnError: false,
            target: altCallReceiver.address,
            data: altCallReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(229))])
          }]

          const estimated = await estimateGasUsage(transactions, wallet)
          const gasUsed = await wallet.sendTransactions(transactions).then((t) => t.wait()).then((r) => r.gasUsed.toNumber())

          // TODO: The estimator overEstimates the gas usage due to the gas refund
          expect(gasUsed).to.be.below(estimated)
        })
      })
    })
  })
})

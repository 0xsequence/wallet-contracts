import { expect, encodeImageHash, signAndEncodeMetaTxn, addressOf, multiSignAndEncodeMetaTxn, multiSignAndExecuteMetaTx } from './utils'
import { ethers as hethers } from 'hardhat'
import * as ethers from 'ethers'


import { GasEstimator, CallReceiverMock, MainModuleGasEstimation, Factory, GuestModule, GasEstimator__factory, CallReceiverMock__factory, GuestModule__factory, Factory__factory, MainModuleGasEstimation__factory, ModuleMock__factory } from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

function txBaseCost(data: ethers.BytesLike): number {
  const bytes = ethers.utils.arrayify(data)
  return bytes.reduce((p, c) => c == 0 ? p.add(4) : p.add(16), ethers.constants.Zero).add(21000).toNumber()
}

contract('Estimate gas usage', (accounts: string[]) => {
  let gasEstimatorFactory: GasEstimator__factory
  let callReceiverMockFactory: CallReceiverMock__factory
  let guestModuleFactory: GuestModule__factory
  let factoryFactory: Factory__factory
  let mainModuleGasEstimationFactory: MainModuleGasEstimation__factory
  let moduleMockFactory: ModuleMock__factory

  let gasEstimator: GasEstimator
  let callReceiver: CallReceiverMock
  let mainModule: MainModuleGasEstimation
  let guestModule: GuestModule
  let factory: Factory

  let networkId: number | string

  let estimate: (address: string, data: ethers.BytesLike) => { call: () => Promise<{success: boolean, result: string, gas: ethers.BigNumber }> }

  let owner: ethers.Wallet
  let salt: string
  let address: string

  const gasUsedFor = async (tx: Promise<ethers.ContractTransaction> | ethers.ContractTransaction) => {
    const receipt = await (await tx).wait()
    return ethers.BigNumber.from(receipt.gasUsed).toNumber()
  }

  before(async () => {
    gasEstimatorFactory = await hethers.getContractFactory('GasEstimator') as GasEstimator__factory
    callReceiverMockFactory = await hethers.getContractFactory('CallReceiverMock') as CallReceiverMock__factory
    guestModuleFactory = await hethers.getContractFactory('GuestModule') as GuestModule__factory
    factoryFactory = await hethers.getContractFactory('Factory') as Factory__factory
    mainModuleGasEstimationFactory = await hethers.getContractFactory('MainModuleGasEstimation') as MainModuleGasEstimation__factory
    moduleMockFactory = await hethers.getContractFactory('ModuleMock') as ModuleMock__factory

    gasEstimator = await gasEstimatorFactory.deploy()
    callReceiver = await callReceiverMockFactory.deploy()

    // Deploy wallet factory
    factory = (await factoryFactory.deploy()) as Factory
    // Deploy MainModuleGasEstimation (hardhat doesn't support overwrites, so we use this as the real module)
    mainModule = await mainModuleGasEstimationFactory.deploy()
    // Get network ID
    networkId = process.env.NET_ID ? process.env.NET_ID : hethers.provider.network.chainId

    guestModule = await guestModuleFactory.deploy()

    // estimate = gasEstimator.contract.methods.estimate
    estimate = (address: string, data: ethers.BytesLike) => ({ call: async () =>  {
      return gasEstimator.callStatic.estimate(address, data)
    }})
  })

  beforeEach(async () => {
    await callReceiver.setRevertFlag(false)
    await callReceiver.testCall(0, [])

    owner = ethers.Wallet.createRandom()

    salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    address = addressOf(factory.address, mainModule.address, salt)
  })

  describe('Estimate gas of transactions', () => {
    context('without wallet deployed', () => {
      const bundleWithDeploy = (txData: string) => {
        return [{
          delegateCall: false,
          revertOnError: true,
          target: factory.address,
          gasLimit: 0,
          data: factory.interface.encodeFunctionData('deploy', [mainModule.address, salt]),
          value: 0
        }, {
          delegateCall: false,
          revertOnError: true,
          target: address,
          gasLimit: 0,
          data: txData,
          value: 0
        }]
      }

      it('Should estimate wallet deployment', async () => {
        const factoryData = factory.interface.encodeFunctionData('deploy', [mainModule.address, salt])

        const estimated = ethers.BigNumber.from((await estimate(factory.address, factoryData).call()).gas).toNumber()
        const realTx = await factory.deploy(mainModule.address, salt)
        expect(estimated + txBaseCost(factoryData)).to.approximately(await gasUsedFor(realTx), 5000)
      })

      it('Should estimate wallet deployment + upgrade', async () => {
        const newImplementation = await moduleMockFactory.deploy()

        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: owner.address,
          value: ethers.constants.Zero,
          data: mainModule.interface.encodeFunctionData('updateImplementation', [newImplementation.address])
        }

        const txData = await signAndEncodeMetaTxn(mainModule as any, owner, [transaction], networkId)
        const txDataNoSignature = await signAndEncodeMetaTxn(mainModule as any, ethers.Wallet.createRandom(), [transaction], networkId)

        const bundleDataNoSignature = guestModule.interface.encodeFunctionData('execute', [bundleWithDeploy(txDataNoSignature), 0, []])

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature).call()).gas).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, [])
        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(await gasUsedFor(realTx), 5000)
      })
      it('Should estimate wallet deployment + upgrade + transaction', async () => {
        const newImplementation = await moduleMockFactory.deploy()

        const transaction = [{
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: owner.address,
          value: ethers.constants.Zero,
          data: mainModule.interface.encodeFunctionData('updateImplementation', [newImplementation.address])
        }, {
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
        }]

        const txData = await signAndEncodeMetaTxn(mainModule as any, owner, transaction, networkId)
        const txDataNoSignature = await signAndEncodeMetaTxn(mainModule as any, ethers.Wallet.createRandom(), transaction, networkId)

        const bundleDataNoSignature = guestModule.interface.encodeFunctionData('execute', [bundleWithDeploy(txDataNoSignature), 0, []])

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature).call()).gas).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, [])
        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(await gasUsedFor(realTx), 5000)
      })
      it('Should estimate wallet deployment + upgrade + failed transaction', async () => {
        const newImplementation = await moduleMockFactory.deploy()

        await callReceiver.setRevertFlag(true)

        const transaction = [{
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: owner.address,
          value: ethers.constants.Zero,
          data: mainModule.interface.encodeFunctionData('updateImplementation', [newImplementation.address])
        }, {
          delegateCall: false,
          revertOnError: false,
          gasLimit: 0,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
        }]

        const txData = await signAndEncodeMetaTxn(mainModule as any, owner, transaction, networkId)
        const txDataNoSignature = await signAndEncodeMetaTxn(mainModule as any, ethers.Wallet.createRandom(), transaction, networkId)

        const bundleDataNoSignature = guestModule.interface.encodeFunctionData('execute', [bundleWithDeploy(txDataNoSignature), 0, []])

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature).call()).gas).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, [])
        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(await gasUsedFor(realTx), 5000)
      })
      it('Should estimate wallet deployment + upgrade + fixed gas transaction', async () => {
        const newImplementation = await moduleMockFactory.deploy()

        const transaction = [{
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: owner.address,
          value: ethers.constants.Zero,
          data: mainModule.interface.encodeFunctionData('updateImplementation', [newImplementation.address])
        }, {
          delegateCall: false,
          revertOnError: false,
          gasLimit: 900000,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
        }]

        const txData = await signAndEncodeMetaTxn(mainModule as any, owner, transaction, networkId)
        const txDataNoSignature = await signAndEncodeMetaTxn(mainModule as any, ethers.Wallet.createRandom(), transaction, networkId)

        const bundleDataNoSignature = guestModule.interface.encodeFunctionData('execute', [bundleWithDeploy(txDataNoSignature), 0, []])

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature).call()).gas).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, [])
        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(await gasUsedFor(realTx), 5000)
      })
    })

    const options = [{
      name: "single signer",
      signers: 1
    }, {
      name: "many signers",
      signers: 32
    }]

    options.map((o) => {
      context(`with wallet deployed and ${o.name}`, () => {
        let wallet: MainModuleGasEstimation

        let owners: ethers.Wallet[]
        let config: { weight: number, address: string }[]
        let threshold: number

        let accounts: { weight: number, owner: ethers.Wallet }[]
        let fakeAccounts: { weight: number, owner: ethers.Wallet }[]
  
        beforeEach(async () => {

          threshold = o.signers

          owners = new Array(o.signers).fill(0).map(() => ethers.Wallet.createRandom())
          config = owners.map((o) => ({ weight: 1, address: o.address }))
          salt = encodeImageHash(threshold, config)
          address = addressOf(factory.address, mainModule.address, salt)

          await factory.deploy(mainModule.address, salt)

          wallet = mainModuleGasEstimationFactory.attach(address)

          accounts = owners.map((c) => ({ weight: 1, owner: c }))
          fakeAccounts = owners.map((c) => ({ weight: 1, owner: ethers.Wallet.createRandom() }))
        })
  
        it('Should estimate single transaction', async () => {
          const transaction = [{
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId)
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature).call()).gas).toNumber()
          const gasUsed = await gasUsedFor(multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0))
  
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 5000)
        })
        it('Should estimate multiple transactions', async () => {
          const transaction = [{
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
          }, {
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))])
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId)
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature).call()).gas).toNumber()
          const gasUsed = await gasUsedFor(multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0))
  
          // TODO: The estimator overEstimates the gas usage due to the gas refund
          expect(gasUsed).to.be.below(estimated + txBaseCost(txDataNoSignature))
          // expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 5000)
        })
        it('Should estimate multiple transactions with bad nonce', async () => {
          const transaction = [{
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
          }, {
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))])
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId, 999999999)
  
          const estimated = ((await estimate(address, txDataNoSignature).call()).gas).toNumber()
          const tx = await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0)
          const gasUsed = await gasUsedFor(tx)
  
          // TODO: The estimator overEstimates the gas usage due to the gas refund
          expect(gasUsed).to.be.below(estimated + txBaseCost(txDataNoSignature))
          // expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 4000)
        })
        it('Should estimate multiple transactions with failing transactions', async () => {
          const altCallReceiver = await callReceiverMockFactory.deploy()
          await altCallReceiver.setRevertFlag(true)
  
          const transaction = [{
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
          }, {
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))])
          }, {
            delegateCall: false,
            revertOnError: false,
            gasLimit: 0,
            target: altCallReceiver.address,
            value: ethers.constants.Zero,
            data: altCallReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(229))])
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId)
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature).call()).gas).toNumber()

          const gasUsed = await gasUsedFor(multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0))

          // TODO: The estimator overEstimates the gas usage due to the gas refund
          expect(gasUsed).to.be.below(estimated)
          // expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 8000)
        })
        it('Should estimate multiple transactions with failing transactions and fixed gas limits', async () => {
          const altCallReceiver = await callReceiverMockFactory.deploy()
          await altCallReceiver.setRevertFlag(true)
  
          const transaction = [{
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(299))])
          }, {
            delegateCall: false,
            revertOnError: false,
            gasLimit: 90000,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))])
          }, {
            delegateCall: false,
            revertOnError: false,
            gasLimit: 0,
            target: altCallReceiver.address,
            value: ethers.constants.Zero,
            data: altCallReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(229))])
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId)
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature).call()).gas).toNumber()
          const gasUsed = await gasUsedFor(multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0))
  
          // TODO: The estimator overEstimates the gas usage due to the gas refund
          expect(gasUsed).to.be.below(estimated + txBaseCost(txDataNoSignature))
          // expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 8000)
        })
      })
    })
  })
})

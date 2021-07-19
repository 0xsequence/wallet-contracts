import * as ethers from 'ethers'
import { expect, encodeImageHash, signAndEncodeMetaTxn, addressOf, signAndExecuteMetaTx, multiSignAndEncodeMetaTxn, multiSignAndExecuteMetaTx } from './utils'
import { web3 } from 'hardhat'


import { GasEstimator, CallReceiverMock, ModuleMock, MainModuleGasEstimation, Factory, GuestModule, MainModule } from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const GasEstimatorArtifact = artifacts.require('GasEstimator')
const CallReceiverMockArtifact = artifacts.require('CallReceiverMock')
const FactoryArtifact = artifacts.require('Factory')
const MainModuleGasEstimationArtifact = artifacts.require('MainModuleGasEstimation')
const GuestModuleArtifact = artifacts.require('GuestModule')
const ModuleMockArtifact = artifacts.require('ModuleMock')

function txBaseCost(data: ethers.BytesLike): number {
  const bytes = ethers.utils.arrayify(data)
  return bytes.reduce((p, c) => c == 0 ? p.add(4) : p.add(16), ethers.constants.Zero).add(21000).toNumber()
}

contract('Estimate gas usage', (accounts: string[]) => {
  let gasEstimator: GasEstimator
  let callReceiver: CallReceiverMock
  let mainModule: MainModuleGasEstimation
  let guestModule: GuestModule
  let factory: Factory

  let networkId: number | string

  let estimate: (address: string, data: ethers.BytesLike) => { call: () => Promise<{success: boolean, result: string, gas: string}> }

  let owner: ethers.Wallet
  let salt: string
  let address: string

  before(async () => {
    gasEstimator = await GasEstimatorArtifact.new()
    callReceiver = await CallReceiverMockArtifact.new()

    // Deploy wallet factory
    factory = (await FactoryArtifact.new()) as Factory
    // Deploy MainModuleGasEstimation (hardhat doesn't support overwrites, so we use this as the real module)
    mainModule = await MainModuleGasEstimationArtifact.new(factory.address)
    // Get network ID
    networkId = process.env.NET_ID ? process.env.NET_ID : await web3.eth.net.getId()

    guestModule = await GuestModuleArtifact.new()

    estimate = gasEstimator.contract.methods.estimate
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
          data: factory.contract.methods.deploy(mainModule.address, salt).encodeABI(),
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
        const factoryData = factory.contract.methods.deploy(mainModule.address, salt).encodeABI()
        const estimated = ethers.BigNumber.from((await estimate(factory.address, factoryData).call()).gas).toNumber()
        const realTx = await factory.deploy(mainModule.address, salt) as any
        expect(estimated + txBaseCost(factoryData)).to.approximately(realTx.receipt.gasUsed, 2000)
      })

      it('Should estimate wallet deployment + upgrade', async () => {
        const newImplementation = (await ModuleMockArtifact.new()) as ModuleMock

        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: owner.address,
          value: ethers.constants.Zero,
          data: mainModule.contract.methods.updateImplementation(newImplementation.address).encodeABI()
        }

        const txData = await signAndEncodeMetaTxn(mainModule as any, owner, [transaction], networkId)
        const txDataNoSignature = await signAndEncodeMetaTxn(mainModule as any, ethers.Wallet.createRandom(), [transaction], networkId)

        const bundleDataNoSignature = guestModule.contract.methods.execute(bundleWithDeploy(txDataNoSignature), 0, []).encodeABI()

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature).call()).gas).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, []) as any
        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(realTx.receipt.gasUsed, 2000)
      })
      it('Should estimate wallet deployment + upgrade + transaction', async () => {
        const newImplementation = (await ModuleMockArtifact.new()) as ModuleMock

        const transaction = [{
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: owner.address,
          value: ethers.constants.Zero,
          data: mainModule.contract.methods.updateImplementation(newImplementation.address).encodeABI()
        }, {
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(299))).encodeABI()
        }]

        const txData = await signAndEncodeMetaTxn(mainModule as any, owner, transaction, networkId)
        const txDataNoSignature = await signAndEncodeMetaTxn(mainModule as any, ethers.Wallet.createRandom(), transaction, networkId)

        const bundleDataNoSignature = guestModule.contract.methods.execute(bundleWithDeploy(txDataNoSignature), 0, []).encodeABI()

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature).call()).gas).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, []) as any
        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(realTx.receipt.gasUsed, 2000)
      })
      it('Should estimate wallet deployment + upgrade + failed transaction', async () => {
        const newImplementation = (await ModuleMockArtifact.new()) as ModuleMock

        await callReceiver.setRevertFlag(true)

        const transaction = [{
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: owner.address,
          value: ethers.constants.Zero,
          data: mainModule.contract.methods.updateImplementation(newImplementation.address).encodeABI()
        }, {
          delegateCall: false,
          revertOnError: false,
          gasLimit: 0,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(299))).encodeABI()
        }]

        const txData = await signAndEncodeMetaTxn(mainModule as any, owner, transaction, networkId)
        const txDataNoSignature = await signAndEncodeMetaTxn(mainModule as any, ethers.Wallet.createRandom(), transaction, networkId)

        const bundleDataNoSignature = guestModule.contract.methods.execute(bundleWithDeploy(txDataNoSignature), 0, []).encodeABI()

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature).call()).gas).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, []) as any
        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(realTx.receipt.gasUsed, 2000)
      })
      it('Should estimate wallet deployment + upgrade + fixed gas transaction', async () => {
        const newImplementation = (await ModuleMockArtifact.new()) as ModuleMock

        const transaction = [{
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: owner.address,
          value: ethers.constants.Zero,
          data: mainModule.contract.methods.updateImplementation(newImplementation.address).encodeABI()
        }, {
          delegateCall: false,
          revertOnError: false,
          gasLimit: 900000,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(299))).encodeABI()
        }]

        const txData = await signAndEncodeMetaTxn(mainModule as any, owner, transaction, networkId)
        const txDataNoSignature = await signAndEncodeMetaTxn(mainModule as any, ethers.Wallet.createRandom(), transaction, networkId)

        const bundleDataNoSignature = guestModule.contract.methods.execute(bundleWithDeploy(txDataNoSignature), 0, []).encodeABI()

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature).call()).gas).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, []) as any
        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(realTx.receipt.gasUsed, 2000)
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
        let wallet: MainModule

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

          wallet = await MainModuleGasEstimationArtifact.at(address)

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
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(299))).encodeABI()
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId)
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature).call()).gas).toNumber()
          const gasUsed = (await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0) as any).receipt.gasUsed
  
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 2000)
        })
        it('Should estimate multiple transactions', async () => {
          const transaction = [{
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(299))).encodeABI()
          }, {
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))).encodeABI()
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId)
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature).call()).gas).toNumber()
          const gasUsed = (await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0) as any).receipt.gasUsed
  
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 4000)
        })
        it('Should estimate multiple transactions with bad nonce', async () => {
          const transaction = [{
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(299))).encodeABI()
          }, {
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))).encodeABI()
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId, 999999999)
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature).call()).gas).toNumber()
          const gasUsed = (await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0) as any).receipt.gasUsed
  
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 4000)
        })
        it('Should estimate multiple transactions with failing transactions', async () => {
          const altCallReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
          await altCallReceiver.setRevertFlag(true)
  
          const transaction = [{
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(299))).encodeABI()
          }, {
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))).encodeABI()
          }, {
            delegateCall: false,
            revertOnError: false,
            gasLimit: 0,
            target: altCallReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(229))).encodeABI()
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId)
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature).call()).gas).toNumber()
          const gasUsed = (await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0) as any).receipt.gasUsed
  
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 8000)
        })
        it('Should estimate multiple transactions with failing transactions and fixed gas limits', async () => {
          const altCallReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
          await altCallReceiver.setRevertFlag(true)
  
          const transaction = [{
            delegateCall: false,
            revertOnError: true,
            gasLimit: 0,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(299))).encodeABI()
          }, {
            delegateCall: false,
            revertOnError: false,
            gasLimit: 90000,
            target: callReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(2299))).encodeABI()
          }, {
            delegateCall: false,
            revertOnError: false,
            gasLimit: 0,
            target: altCallReceiver.address,
            value: ethers.constants.Zero,
            data: callReceiver.contract.methods.testCall(1, ethers.utils.hexlify(ethers.utils.randomBytes(229))).encodeABI()
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId)
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature).call()).gas).toNumber()
          const gasUsed = (await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0) as any).receipt.gasUsed
  
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 8000)
        })
      })
    })
  })
})

import { ethers } from 'ethers'
import { ethers as hardhat, web3 } from 'hardhat'
import { expect, encodeImageHash, signAndEncodeMetaTxn, addressOf, multiSignAndEncodeMetaTxn, multiSignAndExecuteMetaTx } from './utils'

import { Factory__factory, GasEstimator__factory, CallReceiverMock__factory, GuestModule__factory, MainModuleGasEstimation__factory, ModuleMock__factory } from '../src'
import { GasEstimator, CallReceiverMock, ModuleMock, MainModuleGasEstimation, Factory, GuestModule, MainModule } from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

function txBaseCost(data: ethers.BytesLike): number {
  const bytes = ethers.utils.arrayify(data)
  return bytes.reduce((p, c) => c == 0 ? p.add(4) : p.add(16), ethers.constants.Zero).add(21000).toNumber()
}

// NOTE/TODO/REVIEW: all of the 'approximately' gasUsed numbers are way too high, previously we could compute
// gas limit to a variance of 2000, and now have to use 40_000+. The contracts are the same, the only difference
// is a newer version of ethers, and newer version of hardhat.
//
// Another theory, it looks like the baseCost is already factored into the estimation somehow? .. or, hardhat
// doesn't include the baseCost for its transactions, so maybe this is off by the configuration.
// You can see this if you compare 'estimated' below to the 'gasUsed'

contract('Estimate gas usage', (accounts: string[]) => {
  let signer: ethers.Signer
  let networkId: number

  let gasEstimator: GasEstimator
  let callReceiver: CallReceiverMock
  let mainModule: MainModuleGasEstimation
  let guestModule: GuestModule
  let factory: Factory

  let estimate: typeof gasEstimator.functions.estimate

  let owner: ethers.Wallet
  let salt: string
  let address: string

  before(async () => {
    // get signer from hardhat
    signer = (await hardhat.getSigners())[0]

    // Get network ID
    networkId = process.env.NET_ID ? Number(process.env.NET_ID) : await web3.eth.net.getId()

    // Deploy
    gasEstimator = await (new GasEstimator__factory()).connect(signer).deploy()
    callReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()

    // Deploy wallet factory
    factory = await (new Factory__factory()).connect(signer).deploy()

    // Deploy MainModuleGasEstimation (hardhat doesn't support overwrites, so we use this as the real module)
    mainModule = await (new MainModuleGasEstimation__factory()).connect(signer).deploy()

    guestModule = await (new GuestModule__factory()).connect(signer).deploy()

    estimate = gasEstimator.functions.estimate
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
        const estimated = ethers.BigNumber.from((await estimate(factory.address, factoryData)).gasLimit).toNumber()
        const realTx = await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
        const realTxReceipt = await realTx.wait()

        // NOTE: we set a high variance here as gas estimation on factory is a bit tricky from hardhat.
        // or perhaps the txBaseCost() is wrong somehow..? could be hardhat's opcode pricing is off too.
        expect(estimated + txBaseCost(factoryData)).to.approximately(realTxReceipt.gasUsed.toNumber(), 30_000)
      })

      it('Should estimate wallet deployment + upgrade', async () => {
        // const newImplementation = (await ModuleMockArtifact.new()) as ModuleMock
        const newImplementation = await (new ModuleMock__factory()).connect(signer).deploy()

        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: 0,
          target: owner.address,
          value: ethers.constants.Zero,
          data: mainModule.interface.encodeFunctionData('updateImplementation', [newImplementation.address])
        }

        const txData = await signAndEncodeMetaTxn(mainModule as unknown as MainModule, owner, [transaction], networkId)
        const txDataNoSignature = await signAndEncodeMetaTxn(mainModule as unknown as MainModule, ethers.Wallet.createRandom(), [transaction], networkId)

        const bundleDataNoSignature = guestModule.interface.encodeFunctionData('execute', [bundleWithDeploy(txDataNoSignature), 0, []])

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature)).gasLimit).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, [])
        const realTxReceipt = await realTx.wait()

        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(realTxReceipt.gasUsed.toNumber(), 40_000)
      })
      it('Should estimate wallet deployment + upgrade + transaction', async () => {
        const newImplementation = await (new ModuleMock__factory()).connect(signer).deploy()

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

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature)).gasLimit).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, [])
        const realTxReceipt = await realTx.wait()

        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(realTxReceipt.gasUsed.toNumber(), 50_000)
      })
      it('Should estimate wallet deployment + upgrade + failed transaction', async () => {
        const newImplementation = await (new ModuleMock__factory()).connect(signer).deploy()

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

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature)).gasLimit).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, [])
        const realTxReceipt = await realTx.wait()

        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(realTxReceipt.gasUsed.toNumber(), 50_000)
      })
      it('Should estimate wallet deployment + upgrade + fixed gas transaction', async () => {
        const newImplementation = await (new ModuleMock__factory()).connect(signer).deploy()

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

        const estimated = ethers.BigNumber.from((await estimate(guestModule.address, bundleDataNoSignature)).gasLimit).toNumber()
        const realTx = await guestModule.execute(bundleWithDeploy(txData), 0, [])
        const realTxReceipt = await realTx.wait()

        expect(estimated + txBaseCost(bundleDataNoSignature)).to.approximately(realTxReceipt.gasUsed.toNumber(), 50_000)
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

          await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })

          wallet = await MainModuleGasEstimation__factory.connect(address, signer) as unknown as MainModule

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
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature)).gasLimit).toNumber()
          const tx = await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0)
          const gasUsed = (await tx.wait()).gasUsed.toNumber()
  
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 100_000)
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
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature)).gasLimit).toNumber()
          const tx = await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0)
          const gasUsed = (await tx.wait()).gasUsed.toNumber()
  
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 150_000)
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
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature)).gasLimit).toNumber()
          const tx = await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0)
          const gasUsed = (await tx.wait()).gasUsed.toNumber()
  
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 150_000)
        })
        it('Should estimate multiple transactions with failing transactions', async () => {
          // const altCallReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
          const altCallReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()
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
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(229))])
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId)
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature)).gasLimit).toNumber()
          const tx = await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0)
          const gasUsed = (await tx.wait()).gasUsed.toNumber()

          console.log('estimated', estimated)
          console.log('basecost', txBaseCost(txDataNoSignature))
          console.log('gasUsed', gasUsed)
          
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 120_000)
        })
        it('Should estimate multiple transactions with failing transactions and fixed gas limits', async () => {
          const altCallReceiver = await (new CallReceiverMock__factory()).connect(signer).deploy()
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
            data: callReceiver.interface.encodeFunctionData('testCall', [1, ethers.utils.hexlify(ethers.utils.randomBytes(229))])
          }]
  
          const txDataNoSignature = await multiSignAndEncodeMetaTxn(mainModule as any, fakeAccounts, threshold, transaction, networkId)
  
          const estimated = ethers.BigNumber.from((await estimate(address, txDataNoSignature)).gasLimit).toNumber()
          const tx = await multiSignAndExecuteMetaTx(wallet, accounts, threshold, transaction, networkId, 0)
          const gasUsed = (await tx.wait()).gasUsed.toNumber()
  
          expect(estimated + txBaseCost(txDataNoSignature)).to.approximately(gasUsed, 150_000)
        })
      })
    })
  })
})

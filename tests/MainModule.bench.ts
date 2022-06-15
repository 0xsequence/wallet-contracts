import * as ethers from 'ethers'
import { signAndExecuteMetaTx, encodeImageHash, multiSignAndExecuteMetaTx, addressOf } from './utils'

import { MainModule, Factory } from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const runs = 256
import { ethers as hethers, web3 } from 'hardhat'

const optimalGasLimit = ethers.constants.Two.pow(22)

function report(test: string, values: ethers.BigNumberish[]) {
  const bns = values.map(v => ethers.BigNumber.from(v))

  const min = bns.reduce((a, b) => a.lt(b) ? a : b)
  const max = bns.reduce((a, b) => a.gt(b) ? a : b)
  const avg = bns
    .reduce((p, n) => p.add(n))
    .div(values.length)

  console.info(` -> ${test} runs: ${values.length} cost min: ${min.toString()} max: ${max.toString()} avg: ${avg.toString()}`)
}

contract('MainModule', () => {
  let factoryFactory
  let moduleFactory

  let factory: Factory
  let module: MainModule

  let networkId: ethers.BigNumberish

  before(async () => {
    factoryFactory = await hethers.getContractFactory('Factory') // as Factory__factory
    moduleFactory = await hethers.getContractFactory('MainModule') // as MainModule__factory

    const mainModuleUpgradableFactory = await hethers.getContractFactory('MainModuleUpgradable')
    const moduleUpgradable = await mainModuleUpgradableFactory.deploy()

    // Deploy wallet factory
    factory = await factoryFactory.deploy()
    // Deploy MainModule
    module = await moduleFactory.deploy(factory.address, moduleUpgradable.address)
    // Get network ID
    networkId = await web3.eth.net.getId()
  })

  if (process.env.BENCHMARK) {
    describe.only('Benchmark', function() {
      ;(this as any).timeout(0)

      it('Deploy a wallet', async () => {
        const results: ethers.BigNumberish[] = []

        for (let i = 0; i < runs; i++) {
          const owner = new ethers.Wallet(ethers.utils.randomBytes(32))
          const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
          const tx = await factory.deploy(module.address, salt)
          const receipt = await tx.wait()
          results.push(receipt.gasUsed)
        }

        report('deploy wallets', results)
      })

      it('Relay 1/1 transaction', async () => {
        const results: ethers.BigNumberish[] = []

        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: ethers.constants.AddressZero,
          value: ethers.constants.Zero,
          data: []
        }

        for (let i = 0; i < runs; i++) {
          const owner = new ethers.Wallet(ethers.utils.randomBytes(32))
          const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
          await factory.deploy(module.address, salt)
          const wallet = moduleFactory.attach(addressOf(factory.address, module.address, salt))

          const tx = await signAndExecuteMetaTx(wallet, owner, [transaction], networkId)
          const receipt = await tx.wait()

          results.push(receipt.gasUsed)
        }

        report('relay 1/1 transaction', results)
      })

      const batches = [2, 3, 5, 10, 50, 100]
      batches.forEach(n => {
        it(`Relay 1/1 ${n} transactions`, async () => {
          const results: ethers.BigNumberish[] = []

          const transactions = new Array(n).fill(0).map(() => ({
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          }))

          for (let i = 0; i < runs; i++) {
            const owner = new ethers.Wallet(ethers.utils.randomBytes(32))
            const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
            await factory.deploy(module.address, salt)
            const wallet = moduleFactory.attach(addressOf(factory.address, module.address, salt))

            const tx = await signAndExecuteMetaTx(wallet, owner, transactions, networkId)
            const receipt = await tx.wait()

            results.push(receipt.gasUsed)
          }

          report(`relay 1/1 ${n} transactions`, results)
        })
      })
      batches.forEach(n => {
        const ntxs = Math.floor(n / 2)
        const nfailing = n - ntxs
        it(`Relay 1/1 ${ntxs} transactions and ${nfailing} failing transactions`, async () => {
          const results: ethers.BigNumberish[] = []

          const transactions = new Array(ntxs)
            .fill(0)
            .map(() => ({
              delegateCall: false,
              revertOnError: true,
              gasLimit: optimalGasLimit,
              target: ethers.constants.AddressZero,
              value: ethers.constants.Zero,
              data: []
            }))
            .concat(
              new Array(nfailing).fill(0).map(() => ({
                delegateCall: false,
                revertOnError: false,
                gasLimit: optimalGasLimit,
                target: factory.address,
                value: ethers.constants.Zero,
                data: []
              }))
            )

          for (let i = 0; i < runs; i++) {
            const owner = new ethers.Wallet(ethers.utils.randomBytes(32))
            const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
            await factory.deploy(module.address, salt)
            const wallet = moduleFactory.attach(addressOf(factory.address, module.address, salt))

            const tx = await signAndExecuteMetaTx(wallet, owner, transactions, networkId)
            const receipt = await tx.wait()

            results.push(receipt.gasUsed)
          }

          report(`relay 1/1 ${ntxs} transactions and ${nfailing} failing transactions`, results)
        })
      })

      it('Relay 2/5 transaction', async () => {
        const results: ethers.BigNumberish[] = []

        const threshold = 4
        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: ethers.constants.AddressZero,
          value: ethers.constants.Zero,
          data: []
        }

        for (let i = 0; i < runs; i++) {
          const owners = Array(5)
            .fill(0)
            .map(() => new ethers.Wallet(ethers.utils.randomBytes(32)))
          const weights = [3, 3, 1, 1, 1]

          const salt = encodeImageHash(
            threshold,
            owners.map((owner, i) => ({
              weight: weights[i],
              address: owner.address
            }))
          )

          await factory.deploy(module.address, salt)
          const wallet = moduleFactory.attach(addressOf(factory.address, module.address, salt))

          const signers = [0, 3]

          const accounts = owners.map((owner, i) => ({
            weight: weights[i],
            owner: signers.includes(i) ? owner : owner.address
          }))

          const tx = await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId)
          const receipt = await tx.wait()

          results.push(receipt.gasUsed)
        }

        report('relay 2/5 transaction', results)
      })
      it('Relay 255/255 transaction', async () => {
        const results: ethers.BigNumberish[] = []

        const threshold = 255
        const weight = 1
        const transaction = {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: ethers.constants.AddressZero,
          value: ethers.constants.Zero,
          data: []
        }

        for (let i = 0; i < runs; i++) {
          const owners = Array(255)
            .fill(0)
            .map(() => new ethers.Wallet(ethers.utils.randomBytes(32)))

          const salt = encodeImageHash(
            threshold,
            owners.map(owner => ({
              weight: weight,
              address: owner.address
            }))
          )

          await factory.deploy(module.address, salt)
          const wallet = moduleFactory.attach(addressOf(factory.address, module.address, salt))

          const accounts = owners.map(owner => ({
            weight: weight,
            owner: owner
          }))

          const tx = await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId, undefined, false, 60000000)
          const receipt = await tx.wait()

          results.push(receipt.gasUsed)
        }

        report('relay 255/255 transaction', results)
      })
    })
  }
})

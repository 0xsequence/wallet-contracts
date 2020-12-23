import * as ethers from 'ethers'
import { signAndExecuteMetaTx, encodeImageHash, multiSignAndExecuteMetaTx, addressOf } from './utils';

import { MainModule, Factory } from 'typings/contracts/ethers-v5'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const FactoryArtifact = artifacts.require('Factory')
const MainModuleArtifact = artifacts.require('MainModule')

const runs = 256
import { web3 } from 'hardhat'

const optimalGasLimit = ethers.constants.Two.pow(22)

function report(test: string, values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.map((n) => ethers.BigNumber.from(n))
    .reduce((p, n) => p.add(n)).div(values.length).toNumber()

  console.info(` -> ${test} runs: ${values.length} cost min: ${min} max: ${max} avg: ${avg}`)
}

contract('MainModule', () => {
  let factory
  let module

  let networkId

  before(async () => {
    // Deploy wallet factory
    factory = await FactoryArtifact.new() as Factory
    // Deploy MainModule
    module = await MainModuleArtifact.new(factory.address) as MainModule
    // Get network ID
    networkId = await web3.eth.net.getId()
  })

  if (process.env.BENCHMARK) {
    describe.only('Benchmark', function () {
      (this as any).timeout(0)

      it('Deploy a wallet', async () => {
        const results: number[] = []

        for (let i = 0; i < runs; i++) {
          const owner = new ethers.Wallet(ethers.utils.randomBytes(32))
          const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
          const tx = await factory.deploy(module.address, salt)
          results.push(tx.receipt.gasUsed)
        }

        report('deploy wallets', results)
      })

      it('Relay 1/1 transaction', async () => {
        const results: number[] = []

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
          const wallet = await MainModuleArtifact.at(addressOf(factory.address, module.address, salt)) as MainModule

          const tx = await signAndExecuteMetaTx(wallet, owner, [transaction], networkId) as any
          results.push(tx.receipt.gasUsed)
        }

        report('relay 1/1 transaction', results)
      })

      const batches = [2, 3, 5, 10, 50, 100]
      batches.forEach((n) => {
        it(`Relay 1/1 ${n} transactions`, async () => {
          const results: number[] = []

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
            const wallet = await MainModuleArtifact.at(addressOf(factory.address, module.address, salt)) as MainModule

            const tx = await signAndExecuteMetaTx(wallet, owner, transactions, networkId) as any
            results.push(tx.receipt.gasUsed)
          }

          report(`relay 1/1 ${n} transactions`, results)
        })
      })
      batches.forEach((n) => {
        const ntxs = Math.floor(n /2)
        const nfailing = n - ntxs
        it(`Relay 1/1 ${ntxs} transactions and ${nfailing} failing transactions`, async () => {
          const results: number[] = []

          const transactions = new Array(ntxs).fill(0).map(() => ({
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: ethers.constants.AddressZero,
            value: ethers.constants.Zero,
            data: []
          })).concat(new Array(nfailing).fill(0).map(() => ({
            delegateCall: false,
            revertOnError: false,
            gasLimit: optimalGasLimit,
            target: factory.address,
            value: ethers.constants.Zero,
            data: []
          })))

          for (let i = 0; i < runs; i++) {
            const owner = new ethers.Wallet(ethers.utils.randomBytes(32))
            const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
            await factory.deploy(module.address, salt)
            const wallet = await MainModuleArtifact.at(addressOf(factory.address, module.address, salt)) as MainModule

            const tx = await signAndExecuteMetaTx(wallet, owner, transactions, networkId) as any
            results.push(tx.receipt.gasUsed)
          }

          report(`relay 1/1 ${ntxs} transactions and ${nfailing} failing transactions`, results)
        })
      })

      it('Relay 2/5 transaction', async () => {
        const results: number[] = []

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
          const owners = Array(5).fill(0).map(() => new ethers.Wallet(ethers.utils.randomBytes(32)))
          const weights = [3, 3, 1, 1, 1]

          const salt = encodeImageHash(
            threshold,
            owners.map((owner, i) => ({
              weight: weights[i],
              address: owner.address
            }))
          )

          await factory.deploy(module.address, salt)
          const wallet = await MainModuleArtifact.at(addressOf(factory.address, module.address, salt)) as MainModule

          const signers = [0, 3]

          const accounts = owners.map((owner, i) => ({
            weight: weights[i],
            owner: signers.includes(i) ? owner : owner.address
          }))

          const tx = await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId) as any
          results.push(tx.receipt.gasUsed)
        }

        report('relay 2/5 transaction', results)
      })
      it('Relay 255/255 transaction', async () => {
        const results: number[] = []

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
          const owners = Array(255).fill(0).map(() => new ethers.Wallet(ethers.utils.randomBytes(32)))

          const salt = encodeImageHash(
            threshold,
            owners.map((owner) => ({
              weight: weight,
              address: owner.address
            }))
          )

          await factory.deploy(module.address, salt)
          const wallet = await MainModuleArtifact.at(addressOf(factory.address, module.address, salt)) as MainModule

          const accounts = owners.map((owner) => ({
            weight: weight,
            owner: owner
          }))

          const tx = await multiSignAndExecuteMetaTx(wallet, accounts, threshold, [transaction], networkId) as any
          results.push(tx.receipt.gasUsed)
        }

        report('relay 255/255 transaction', results)
      })
    })
  }
})

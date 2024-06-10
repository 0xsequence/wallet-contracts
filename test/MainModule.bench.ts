import { ethers } from 'ethers'

import { deploySequenceContext, SequenceContext } from './utils/contracts'
import { SequenceWallet } from './utils/wallet'
import { Transaction } from './utils/sequence'

const optimalGasLimit = 2n ** 22n
const runs = 256

function report2(values: ethers.BigNumberish[]) {
  const bns = values.map(v => BigInt(v))

  const min = bns.reduce((a, b) => (a < b ? a : b))
  const max = bns.reduce((a, b) => (a > b ? a : b))
  const avg = bns.reduce((p, n) => (p + n) / BigInt(values.length))

  return { min, max, avg }
}

function report(test: string, values: ethers.BigNumberish[]) {
  const { min, max, avg } = report2(values)
  console.info(` -> ${test} runs: ${values.length} cost min: ${min.toString()} max: ${max.toString()} avg: ${avg.toString()}`)
}

contract('MainModule', () => {
  let context: SequenceContext

  before(async () => {
    context = await deploySequenceContext()
  })

  if (process.env.BENCHMARK) {
    describe.only('Benchmark', function () {
      ;(this as any).timeout(0)

      it('Deploy a wallet', async () => {
        const results: ethers.BigNumberish[] = []

        for (let i = 0; i < runs; i++) {
          const tx = await SequenceWallet.basicWallet(context).deploy()
          const receipt = await tx?.wait()

          if (!receipt) {
            throw new Error('No receipt')
          }

          results.push(receipt.gasUsed)
        }

        report('deploy wallets', results)
      })

      it('Relay 1/1 transaction', async () => {
        const results: ethers.BigNumberish[] = []

        for (let i = 0; i < runs; i++) {
          const wallet = SequenceWallet.basicWallet(context)
          await wallet.deploy()
          const tx = await wallet.sendTransactions([{}])
          const receipt = await tx.wait()

          if (!receipt) {
            throw new Error('No receipt')
          }

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
            target: ethers.ZeroAddress,
            value: 0n,
            data: '0x0000000000000000000000007109709ecfa91a80626ff3989d68f67f5b1dd12e0000000000000000000000007109709ecfa91a80626ff3989d68f67f5b1dd12e'
          }))

          for (let i = 0; i < runs; i++) {
            const wallet = SequenceWallet.basicWallet(context)
            await wallet.deploy()
            const tx = await wallet.sendTransactions(transactions)
            const receipt = await tx.wait()

            if (!receipt) {
              throw new Error('No receipt')
            }

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

          const transactions: Transaction[] = new Array(ntxs)
            .fill(0)
            .map(() => ({
              delegateCall: false,
              revertOnError: true,
              gasLimit: optimalGasLimit,
              target: ethers.ZeroAddress,
              value: 0n,
              data: new Uint8Array([])
            }))
            .concat(
              await Promise.all(
                new Array(nfailing).fill(0).map(async () => ({
                  delegateCall: false,
                  revertOnError: false,
                  gasLimit: optimalGasLimit,
                  target: await context.factory.getAddress(),
                  value: 0n,
                  data: new Uint8Array([])
                }))
              )
            )

          for (let i = 0; i < runs; i++) {
            const wallet = SequenceWallet.basicWallet(context)
            await wallet.deploy()
            const tx = await wallet.sendTransactions(transactions)
            const receipt = await tx.wait()

            if (!receipt) {
              throw new Error('No receipt')
            }

            results.push(receipt.gasUsed)
          }

          report(`relay 1/1 ${ntxs} transactions and ${nfailing} failing transactions`, results)
        })
      })

      const transaction: Transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: ethers.ZeroAddress,
        value: 0n,
        data: new Uint8Array([])
      }

      it('Relay 2/5 transaction', async () => {
        const results: ethers.BigNumberish[] = []

        for (let i = 0; i < runs; i++) {
          const wallet = SequenceWallet.basicWallet(context, { signing: [3, 1], idle: [1, 1, 3], threshold: 4 })
          await wallet.deploy()
          const tx = await wallet.sendTransactions([transaction])
          const receipt = await tx.wait()

          if (!receipt) {
            throw new Error('No receipt')
          }

          results.push(receipt.gasUsed)
        }

        report('relay 2/5 transaction', results)
      })

      it('Relay 255/255 transaction', async () => {
        const results: ethers.BigNumberish[] = []

        for (let i = 0; i < runs; i++) {
          const wallet = SequenceWallet.basicWallet(context, { signing: 255, idle: 0, threshold: 255 })
          await wallet.deploy()

          const tx = await wallet.sendTransactions([transaction], undefined, { gasLimit: 60000000 })
          const receipt = await tx.wait()

          if (!receipt) {
            throw new Error('No receipt')
          }

          results.push(receipt.gasUsed)
        }

        report('relay 255/255 transaction', results)
      })
    })
  }
})

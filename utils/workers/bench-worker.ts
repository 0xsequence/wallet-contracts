import { deploySequenceContext, SequenceContext } from '../../test/utils/contracts'
import { expose } from 'threads/worker'
import { SequenceWallet } from '../../test/utils/wallet'
import { ethers } from 'ethers'
import { legacyTopology, merkleTopology } from '../../test/utils/sequence'

let context: SequenceContext
let wallet: SequenceWallet

let d_runs: number
let d_idle: number
let d_signing: number
let d_disableTrim: boolean

let topologyConverter: any

let prevsnapshot: any

function report2(values: ethers.BigNumberish[]) {
  const bns = values.map(v => BigInt(v))

  const min = bns.reduce((a, b) => (a < b ? a : b))
  const max = bns.reduce((a, b) => (a > b ? a : b))
  const avg = bns.reduce((p, n) => (p + n) / BigInt(values.length))

  return { min, max, avg }
}

const worker = {
  async setup(signing: number, idle: number, runs: number, topology: 'legacy' | 'merkle', disableTrim: boolean) {
    if (!context) {
      context = await deploySequenceContext()
    }

    d_runs = runs
    d_idle = idle
    d_signing = signing
    d_disableTrim = disableTrim

    if (topology !== 'legacy' && topology !== 'merkle') throw new Error('Invalid topology')
    topologyConverter = topology === 'legacy' ? legacyTopology : merkleTopology
  },
  async run() {
    const results: ethers.BigNumberish[] = []
    const calldatas: ethers.BigNumberish[] = []

    for (let i = 0; i < d_runs; i++) {
      wallet = SequenceWallet.basicWallet(context, {
        signing: d_signing,
        idle: d_idle,
        topologyConverter,
        encodingOptions: { disableTrim: d_disableTrim }
      })
      await wallet.deploy()

      const signature = await wallet.signTransactions([{}])
      const tx = await wallet.relayTransactions([{}], signature)
      const receipt = await tx.wait()

      if (!receipt) {
        throw new Error('No receipt')
      }

      results.push(receipt.gasUsed)
      calldatas.push(ethers.getBytes(signature).length)
    }

    const report = report2(results)
    const reportCalldata = report2(calldatas)

    return {
      min: Number(report.min),
      max: Number(report.max),
      avg: Number(report.avg),
      data: {
        min: Number(reportCalldata.min),
        max: Number(reportCalldata.max),
        avg: Number(reportCalldata.avg)
      },
      idle: d_idle,
      signing: d_signing,
      runs: d_runs
    }
  }
}

export type BenchWorker = typeof worker

expose(worker)

import { deploySequenceContext, SequenceContext } from "../../test/utils/contracts"
import { expose } from "threads/worker"
import { SequenceWallet } from '../../test/utils/wallet'
import { ethers } from "ethers"
import { legacyTopology, merkleTopology } from "../../test/utils/sequence"

let context: SequenceContext
let wallet: SequenceWallet

let d_runs: number
let d_idle: number
let d_signing: number
let d_disableTrim: boolean

let topologyConverter: any

let prevsnapshot: any

function report2(values: ethers.BigNumberish[]) {
  const bns = values.map(v => ethers.BigNumber.from(v))

  const min = bns.reduce((a, b) => a.lt(b) ? a : b)
  const max = bns.reduce((a, b) => a.gt(b) ? a : b)
  const avg = bns
    .reduce((p, n) => p.add(n))
    .div(values.length)

  return { min, max, avg }
}

const worker = {
  async setup(
    signing: number,
    idle: number,
    runs: number,
    topology: 'legacy' | 'merkle',
    disableTrim: boolean
  ) {
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

      results.push(receipt.gasUsed)
      calldatas.push(ethers.utils.arrayify(signature).length)
    }

    const report = report2(results)
    const reportCalldata = report2(calldatas)

    return {
      min: report.min.toNumber(),
      max: report.max.toNumber(),
      avg: report.avg.toNumber(),
      data: {
        min: reportCalldata.min.toNumber(),
        max: reportCalldata.max.toNumber(),
        avg: reportCalldata.avg.toNumber()
      },
      idle: d_idle,
      signing: d_signing,
      runs: d_runs
    }
  }
}

export type BenchWorker = typeof worker

expose(worker)

import * as ethers from 'ethers'
import { deploySequenceContext, SequenceContext } from './utils/contracts'
import { legacyTopology, merkleTopology, printTopology, toSimplifiedConfig } from './utils/sequence'
import { SequenceWallet } from './utils/wallet'


contract('MerkleSignatures', () => {
  let context: SequenceContext

  before(async () => {
    context = await deploySequenceContext()
  })

  it("Should display config topology", async () => {
    const wallet = SequenceWallet.basicWallet(context, { signing: 10 })
    const simplifiedConfig = toSimplifiedConfig(wallet.config)
    const topology1 = legacyTopology(simplifiedConfig)
    const topology2 = merkleTopology(simplifiedConfig)

    console.log(`Legacy topology:`)
    const t = printTopology(topology1, undefined, true)
    for (const line of t) {
      console.log(line)
    }

    const t2 = printTopology(topology2)
    for (const line of t2) {
      console.log(line)
    }
  })
})

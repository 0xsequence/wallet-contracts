

import { ethers } from 'ethers'
import { deploySequenceContext, SequenceContext } from './utils/contracts'
import { SequenceWallet } from './utils/wallet'

contract('Chained signatures', (accounts: string[]) => {
  let context: SequenceContext

  let wallet: SequenceWallet
  let typehash: string

  before(async () => {
    context = await deploySequenceContext()
  })

  beforeEach(async () => {
    wallet = SequenceWallet.basicWallet(context)
    await wallet.deploy()
    typehash = await wallet.mainModule.SET_IMAGEHASH_TYPEHASH()
  })

  it("Should accept a single chained signature", async () => {
    const wallet_b = SequenceWallet.basicWallet(context, { address: wallet.address })
    const checkpoint = Math.floor(Date.now())

    const hashSetImagehash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'uint256'],
      [typehash, wallet_b.imageHash, checkpoint]
    ))

    const sig = await wallet.signDigest(hashSetImagehash)
    const topsig = await wallet_b.signTransactions([{}])

    const bundled = ethers.utils.solidityPack(
      ['uint8', 'uint16', 'bytes', 'uint64', 'uint16', 'bytes'],
      [3, ethers.utils.arrayify(topsig).length, topsig, checkpoint, ethers.utils.arrayify(sig).length, sig]
    )

    await wallet_b.relayTransactions([{}], bundled)
  })
})

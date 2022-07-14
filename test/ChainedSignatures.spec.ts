import { expect } from 'chai'
import { ethers } from 'ethers'
import { expectToBeRejected } from './utils'
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

  const chain = (top: string, ...rest: { sig: string, checkpoint: ethers.BigNumberish }[]) => {
    const encodedRest = ethers.utils.solidityPack(
      rest.map(() => ['uint64', 'uint16', 'bytes']).flat(),
      rest.map((r) => [r.checkpoint, ethers.utils.arrayify(r.sig).length, r.sig]).flat()
    )

    return ethers.utils.solidityPack(
      ['uint8', 'uint16', 'bytes', 'bytes'],
      [3, ethers.utils.arrayify(top).length, top, encodedRest]
    )
  }

  const hashSetImagehash = (imagehash: string, checkpoint: ethers.BigNumberish) => {
    return ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'uint256'],
      [typehash, imagehash, checkpoint]
    ))
  }

  it("Should accept a single chained signature", async () => {
    const wallet_b = SequenceWallet.basicWallet(context, { address: wallet.address })
    const checkpoint = Math.floor(Date.now())

    const hsih = hashSetImagehash(wallet_b.imageHash, checkpoint)

    const sig = await wallet.signDigest(hsih)
    const topsig = await wallet_b.signTransactions([{}])
    const bundled = chain(topsig, { sig: sig, checkpoint })

    await wallet_b.relayTransactions([{}], bundled)
  })

  it("Should accept two chained signatures", async () => {
    const wallet_b = SequenceWallet.basicWallet(context, { address: wallet.address, signing: 2, iddle: 1 })
    const wallet_c = SequenceWallet.basicWallet(context, { address: wallet_b.address, signing: 3, iddle: 7 })

    const checkpoint1 = Math.floor(Date.now())
    const checkpoint2 = checkpoint1 + 1

    const hsih1 = hashSetImagehash(wallet_b.imageHash, checkpoint1)
    const hsih2 = hashSetImagehash(wallet_c.imageHash, checkpoint2)

    const sig1 = await wallet.signDigest(hsih1)
    const sig2 = await wallet_b.signDigest(hsih2)

    const topsig = await wallet_c.signTransactions([{}])
    const bundled = chain(topsig, { sig: sig2, checkpoint: checkpoint2 }, { sig: sig1, checkpoint: checkpoint1 })

    await wallet_c.relayTransactions([{}], bundled)
  })

  it("Should reject chained signatures if checkpoint is wrongly ordered", async () => {
    const wallet_b = SequenceWallet.basicWallet(context, { address: wallet.address, signing: 2, iddle: 1 })
    const wallet_c = SequenceWallet.basicWallet(context, { address: wallet_b.address, signing: 3, iddle: 7 })

    const checkpoint1 = Math.floor(Date.now())
    const checkpoint2 = checkpoint1 - 1

    const hsih1 = hashSetImagehash(wallet_b.imageHash, checkpoint1)
    const hsih2 = hashSetImagehash(wallet_c.imageHash, checkpoint2)

    const sig1 = await wallet.signDigest(hsih1)
    const sig2 = await wallet_b.signDigest(hsih2)

    const topsig = await wallet_c.signTransactions([{}])
    const bundled = chain(topsig, { sig: sig2, checkpoint: checkpoint2 }, { sig: sig1, checkpoint: checkpoint1 })

    const tx = wallet_c.relayTransactions([{}], bundled)
    await expectToBeRejected(tx, `WrongChainedCheckpointOrder(${checkpoint1}, ${checkpoint2})`)
  })

  it("Should accept top level signature encoded as chained", async () => {
    const sig = await wallet.signTransactions([{}])
    await wallet.relayTransactions([{}], chain(sig))
  })

  it("Should accept top level signature encoded as chained twice", async () => {
    const sig = await wallet.signTransactions([{}])
    await wallet.relayTransactions([{}], chain(chain(sig)))
  })
})

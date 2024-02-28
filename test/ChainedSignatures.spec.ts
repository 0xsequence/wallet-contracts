import { expect } from 'chai'
import { ethers } from 'ethers'
import { expectToBeRejected } from './utils'
import { deploySequenceContext, SequenceContext } from './utils/contracts'
import { SequenceWallet } from './utils/wallet'

contract('Chained signatures', (accounts: string[]) => {
  let context: SequenceContext

  let wallet: SequenceWallet
  let typeHash: string

  before(async () => {
    context = await deploySequenceContext()
  })

  beforeEach(async () => {
    wallet = SequenceWallet.basicWallet(context)
    await wallet.deploy()
    typeHash = await wallet.mainModule.SET_IMAGE_HASH_TYPE_HASH()
  })

  const chain = (top: string, ...rest: { sig: string }[]) => {
    const encodedRest = ethers.solidityPacked(
      rest.map(() => ['uint24', 'bytes']).flat(),
      rest.map(r => [ethers.getBytes(r.sig).length, r.sig]).flat()
    )

    return ethers.solidityPacked(['uint8', 'uint24', 'bytes', 'bytes'], [3, ethers.getBytes(top).length, top, encodedRest])
  }

  const hashSetImageHash = (imageHash: string) => {
    return ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32'], [typeHash, imageHash]))
  }

  it('Should accept a single chained signature', async () => {
    const wallet_b = SequenceWallet.basicWallet(context, { address: wallet.address })

    const hsih = hashSetImageHash(wallet_b.imageHash)

    const sig = await wallet.signDigest(hsih)
    const topsig = await wallet_b.signTransactions([{}])
    const bundled = chain(topsig, { sig: sig })

    await wallet_b.relayTransactions([{}], bundled)
  })

  it('Should accept two chained signatures', async () => {
    let wallet_b = SequenceWallet.basicWallet(context, { address: wallet.address, signing: 2, idle: 1 })
    let wallet_c = SequenceWallet.basicWallet(context, { address: wallet_b.address, signing: 3, idle: 7 })

    const checkpoint1 = BigInt(wallet.config.checkpoint) + 1n
    const checkpoint2 = checkpoint1 + 1n

    wallet_b = wallet_b.useConfig({ ...wallet_b.config, checkpoint: checkpoint1 })
    wallet_c = wallet_c.useConfig({ ...wallet_c.config, checkpoint: checkpoint2 })

    const hsih1 = hashSetImageHash(wallet_b.imageHash)
    const hsih2 = hashSetImageHash(wallet_c.imageHash)

    const sig1 = await wallet.signDigest(hsih1)
    const sig2 = await wallet_b.signDigest(hsih2)

    const topsig = await wallet_c.signTransactions([{}])
    const bundled = chain(topsig, { sig: sig2 }, { sig: sig1 })

    await wallet_c.relayTransactions([{}], bundled)
  })

  it('Should reject chained signatures if checkpoint is wrongly ordered', async () => {
    let wallet_b = SequenceWallet.basicWallet(context, { address: wallet.address, signing: 2, idle: 1 })
    let wallet_c = SequenceWallet.basicWallet(context, { address: wallet_b.address, signing: 3, idle: 7 })

    const checkpoint1 = BigInt(wallet.config.checkpoint) + 1n
    const checkpoint2 = checkpoint1 - 1n

    wallet_b = wallet_b.useConfig({ ...wallet_b.config, checkpoint: checkpoint1 })
    wallet_c = wallet_c.useConfig({ ...wallet_c.config, checkpoint: checkpoint2 })

    const hsih1 = hashSetImageHash(wallet_b.imageHash)
    const hsih2 = hashSetImageHash(wallet_c.imageHash)

    const sig1 = await wallet.signDigest(hsih1)
    const sig2 = await wallet_b.signDigest(hsih2)

    const topsig = await wallet_c.signTransactions([{}])
    const bundled = chain(topsig, { sig: sig2 }, { sig: sig1 })

    const tx = wallet_c.relayTransactions([{}], bundled)
    await expectToBeRejected(tx, `WrongChainedCheckpointOrder(${checkpoint1}, ${checkpoint2})`)
  })

  it('Should accept top level signature encoded as chained', async () => {
    const sig = await wallet.signTransactions([{}])
    await wallet.relayTransactions([{}], chain(sig))
  })

  it('Should accept top level signature encoded as chained twice', async () => {
    const sig = await wallet.signTransactions([{}])
    await wallet.relayTransactions([{}], chain(chain(sig)))
  })

  it('Should reject signature if current checkpoint is equal to signed checkpoint', async () => {
    let wallet_b = SequenceWallet.basicWallet(context, { address: wallet.address })

    const checkpoint = BigInt(wallet.config.checkpoint)
    wallet_b = wallet_b.useConfig({ ...wallet_b.config, checkpoint: checkpoint })

    const hsih = hashSetImageHash(wallet_b.imageHash)
    const sig = await wallet.signDigest(hsih)
    const topsig = await wallet_b.signTransactions([{}])
    const bundled = chain(topsig, { sig: sig })

    await expectToBeRejected(
      wallet_b.relayTransactions([{}], bundled),
      `WrongChainedCheckpointOrder(${checkpoint}, ${checkpoint})`
    )
  })

  it('Should reject signature if current checkpoint is above to signed checkpoint', async () => {
    let wallet_b = SequenceWallet.basicWallet(context, { address: wallet.address })

    const checkpoint = BigInt(wallet.config.checkpoint) - 1n
    wallet_b = wallet_b.useConfig({ ...wallet_b.config, checkpoint: checkpoint })

    const hsih = hashSetImageHash(wallet_b.imageHash)
    const sig = await wallet.signDigest(hsih)
    const topsig = await wallet_b.signTransactions([{}])
    const bundled = chain(topsig, { sig: sig })

    await expectToBeRejected(
      wallet_b.relayTransactions([{}], bundled),
      `WrongChainedCheckpointOrder(${wallet.config.checkpoint}, ${checkpoint})`
    )
  })
})

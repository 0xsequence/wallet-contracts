import { expect, signAndExecuteMetaTx, encodeImageHash, addressOf, encodeNonce, walletSign, randomHex } from './utils'
import * as ethers from 'ethers'
import { ethers as hethers } from 'hardhat'

import { MainModule, Factory, RequireUtils, RequireFreshSigner, Factory__factory, MainModule__factory, RequireUtils__factory, RequireFreshSigner__factory, CallReceiverMock__factory } from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

function now(): number {
  return Math.floor(Date.now() / 1000)
}

const optimalGasLimit = ethers.constants.Two.pow(21)

contract('Require utils', (accounts: string[]) => {
  let factoryFactory: Factory__factory
  let moduleFactory: MainModule__factory
  let requireUtilsFactory: RequireUtils__factory
  let requireFreshSignerFactory: RequireFreshSigner__factory
  let callReceiverFactory: CallReceiverMock__factory

  let factory: Factory
  let module: MainModule
  let requireUtils: RequireUtils
  let requireFreshSigner: RequireFreshSigner

  let owner: ethers.Wallet
  let wallet: MainModule
  let salt: string

  let networkId: number

  before(async () => {
    factoryFactory = await hethers.getContractFactory('Factory') as Factory__factory
    moduleFactory = await hethers.getContractFactory('MainModule') as MainModule__factory
    requireUtilsFactory = await hethers.getContractFactory('RequireUtils') as RequireUtils__factory
    requireFreshSignerFactory = await hethers.getContractFactory('RequireFreshSigner') as RequireFreshSigner__factory
    callReceiverFactory = await hethers.getContractFactory('CallReceiverMock') as CallReceiverMock__factory

    // Deploy wallet factory
    factory = await factoryFactory.deploy()
    // Deploy MainModule
    module = await moduleFactory.deploy(factory.address)
    // Get network ID
    networkId = process.env.NET_ID ? parseInt(process.env.NET_ID) : hethers.provider.network.chainId
    // Deploy expirable util
    requireUtils = await requireUtilsFactory.deploy(factory.address, module.address)
    // Deploy require fresh signer lib
    requireFreshSigner = await requireFreshSignerFactory.deploy(requireUtils.address)
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    await factory.deploy(module.address, salt)
    wallet = (await moduleFactory.attach(addressOf(factory.address, module.address, salt))) as MainModule
  })

  const stubTxns = [
    {
      delegateCall: false,
      revertOnError: true,
      gasLimit: optimalGasLimit,
      target: ethers.constants.AddressZero,
      value: ethers.constants.Zero,
      data: '0x'
    }
  ]

  describe('Require fresh signer', () => {
    it('Should pass if signer is new', async () => {
      const callReceiver = await callReceiverFactory.deploy()
      await signAndExecuteMetaTx(wallet, owner, stubTxns, networkId)

      const valA = 5423
      const valB = randomHex(120)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: requireFreshSigner.address,
          value: ethers.constants.Zero,
          data: requireFreshSigner.interface.encodeFunctionData('requireFreshSigner', [owner.address])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]

      await signAndExecuteMetaTx(wallet, owner, transactions, networkId)

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should fail if signer is not new', async () => {
      const message = ethers.utils.hexlify(ethers.utils.randomBytes(96))
      const digest = ethers.utils.keccak256(message)
      const preSubDigest = ethers.utils.solidityPack(
        ['string', 'uint256', 'address', 'bytes'],
        ['\x19\x01', networkId, wallet.address, digest]
      )

      const signature = await walletSign(owner, preSubDigest)

      await factory.deploy(module.address, salt)
      await signAndExecuteMetaTx(
        wallet,
        owner,
        [
          {
            delegateCall: false,
            revertOnError: true,
            gasLimit: ethers.constants.Zero,
            target: requireUtils.address,
            value: ethers.constants.Zero,
            data: requireUtils.interface.encodeFunctionData(
              'publishInitialSigners',
              [wallet.address, digest, 1, signature, true]
            )
          }
        ],
        networkId
      )

      const callReceiver = await callReceiverFactory.deploy()
      await signAndExecuteMetaTx(wallet, owner, stubTxns, networkId)

      const valA = 5423
      const valB = randomHex(120)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: requireFreshSigner.address,
          value: ethers.constants.Zero,
          data: requireFreshSigner.interface.encodeFunctionData('requireFreshSigner', [owner.address])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]

      const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      await expect(tx).to.be.rejectedWith("RequireFreshSigner#requireFreshSigner: DUPLICATED_SIGNER")
    })
  })
  describe('Require min-nonce', () => {
    it('Should pass nonce increased from self-wallet', async () => {
      const callReceiver = await callReceiverFactory.deploy()
      await signAndExecuteMetaTx(wallet, owner, stubTxns, networkId)

      const valA = 5423
      const valB = randomHex(120)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: requireUtils.address,
          value: ethers.constants.Zero,
          data: requireUtils.interface.encodeFunctionData('requireMinNonce', [wallet.address, ethers.constants.Two])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]

      await signAndExecuteMetaTx(wallet, owner, transactions, networkId)

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should pass nonce increased from different wallet', async () => {
      const owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt2 = encodeImageHash(1, [{ weight: 1, address: owner2.address }])
      await factory.deploy(module.address, salt2)
      const wallet2 = moduleFactory.attach(addressOf(factory.address, module.address, salt2))

      const callReceiver = await callReceiverFactory.deploy()
      await signAndExecuteMetaTx(wallet2, owner2, stubTxns, networkId)

      const valA = 5423
      const valB = randomHex(120)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: requireUtils.address,
          value: ethers.constants.Zero,
          data: requireUtils.interface.encodeFunctionData('requireMinNonce', [wallet2.address, ethers.constants.One])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]

      await signAndExecuteMetaTx(wallet, owner, transactions, networkId)

      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should fail if nonce is below required on different wallet', async () => {
      const owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt2 = encodeImageHash(1, [{ weight: 1, address: owner2.address }])
      await factory.deploy(module.address, salt2)
      const wallet2 = moduleFactory.attach(addressOf(factory.address, module.address, salt2))

      const callReceiver = await callReceiverFactory.deploy()
      await signAndExecuteMetaTx(wallet2, owner2, stubTxns, networkId)

      const valA = 5423
      const valB = randomHex(120)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: requireUtils.address,
          value: ethers.constants.Zero,
          data: requireUtils.interface.encodeFunctionData('requireMinNonce', [wallet2.address, ethers.constants.Two])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]

      const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      await expect(tx).to.be.rejectedWith('RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED')
    })
    it('Should fail if nonce is below required on self-wallet on a different space', async () => {
      const callReceiver = await callReceiverFactory.deploy()
      await signAndExecuteMetaTx(wallet, owner, stubTxns, networkId)

      const valA = 5423
      const valB = randomHex(120)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: requireUtils.address,
          value: ethers.constants.Zero,
          data: requireUtils.interface.encodeFunctionData('requireMinNonce', [wallet.address, encodeNonce(ethers.constants.Two, ethers.constants.One)])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]

      const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      await expect(tx).to.be.rejectedWith('RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED')
    })
    it('Should fail if nonce is below required on self-wallet', async () => {
      const callReceiver = await callReceiverFactory.deploy()

      const valA = 5423
      const valB = randomHex(120)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: requireUtils.address,
          value: ethers.constants.Zero,
          data: requireUtils.interface.encodeFunctionData('requireMinNonce', [wallet.address, ethers.constants.Two])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]
      const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      await expect(tx).to.be.rejectedWith('RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED')
    })
  })
  describe('Expirable transactions', () => {
    it('Should pass if non expired', async () => {
      await requireUtils.requireNonExpired(now() + 1480)
    })
    it('Should fail if expired', async () => {
      const tx = requireUtils.requireNonExpired(now() - 1)
      await expect(tx).to.be.rejectedWith('RequireUtils#requireNonExpired: EXPIRED')
    })
    it('Should pass bundle if non expired', async () => {
      const callReceiver = await callReceiverFactory.deploy()

      const valA = 5423
      const valB = randomHex(120)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: requireUtils.address,
          value: ethers.constants.Zero,
          data: requireUtils.interface.encodeFunctionData('requireNonExpired', [now() + 1480])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]

      await signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      expect(await callReceiver.lastValA()).to.equal(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should fail bundle if expired', async () => {
      const callReceiver = await callReceiverFactory.deploy()

      const valA = 5423
      const valB = randomHex(120)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: requireUtils.address,
          value: ethers.constants.Zero,
          data: requireUtils.interface.encodeFunctionData('requireNonExpired', [now() - 1])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: callReceiver.address,
          value: ethers.constants.Zero,
          data: callReceiver.interface.encodeFunctionData('testCall', [valA, valB])
        }
      ]

      const tx = signAndExecuteMetaTx(wallet, owner, transactions, networkId)
      await expect(tx).to.be.rejectedWith('RequireUtils#requireNonExpired: EXPIRED')
    })
  })
})

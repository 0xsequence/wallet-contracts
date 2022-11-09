import * as ethers from 'ethers'
import { expect, signAndExecuteMetaTx, RevertError, encodeImageHash, addressOf, encodeNonce, walletSign } from './utils'

import { MainModule, Factory, RequireUtils, CallReceiverMock, RequireFreshSigner } from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const FactoryArtifact = artifacts.require('Factory')
const MainModuleArtifact = artifacts.require('MainModule')
const RequireUtilsArtifact = artifacts.require('RequireUtils')
const CallReceiverMockArtifact = artifacts.require('CallReceiverMock')
const RequireFreshSignerArtifact = artifacts.require('RequireFreshSigner')

import { web3 } from 'hardhat'

function now(): number {
  return Math.floor(Date.now() / 1000)
}

const optimalGasLimit = ethers.constants.Two.pow(21)

contract('Require utils', (accounts: string[]) => {
  let factory: Factory
  let module: MainModule
  let requireUtils: RequireUtils
  let requireFreshSigner: RequireFreshSigner

  let owner: ethers.Wallet
  let wallet: MainModule
  let salt: string

  let networkId: number

  before(async () => {
    // Deploy wallet factory
    factory = await FactoryArtifact.new()
    // Deploy MainModule
    module = await MainModuleArtifact.new(factory.address)
    // Get network ID
    networkId = process.env.NET_ID ? parseInt(process.env.NET_ID) : await web3.eth.net.getId()
    // Deploy expirable util
    requireUtils = await RequireUtilsArtifact.new(factory.address, module.address)
    // Deploy require fresh signer lib
    requireFreshSigner = await RequireFreshSignerArtifact.new(requireUtils.address)
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    await factory.deploy(module.address, salt)
    wallet = (await MainModuleArtifact.at(addressOf(factory.address, module.address, salt))) as MainModule
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
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      await signAndExecuteMetaTx(wallet, owner, stubTxns, networkId)

      const valA = 5423
      const valB = web3.utils.randomHex(120)

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

      expect(await callReceiver.lastValA()).to.eq.BN(valA)
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
              'publishInitialSigners', [
                wallet.address,
                digest,
                1,
                signature,
                true
              ])
          }
        ],
        networkId
      )

      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      await signAndExecuteMetaTx(wallet, owner, stubTxns, networkId)

      const valA = 5423
      const valB = web3.utils.randomHex(120)

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
      await expect(tx).to.be.rejectedWith(RevertError("RequireFreshSigner#requireFreshSigner: DUPLICATED_SIGNER"))
    })
  })
  describe('Require min-nonce', () => {
    it('Should pass nonce increased from self-wallet', async () => {
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      await signAndExecuteMetaTx(wallet, owner, stubTxns, networkId)

      const valA = 5423
      const valB = web3.utils.randomHex(120)

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

      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should pass nonce increased from different wallet', async () => {
      const owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt2 = encodeImageHash(1, [{ weight: 1, address: owner2.address }])
      await factory.deploy(module.address, salt2)
      const wallet2 = (await MainModuleArtifact.at(addressOf(factory.address, module.address, salt2))) as MainModule

      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      await signAndExecuteMetaTx(wallet2, owner2, stubTxns, networkId)

      const valA = 5423
      const valB = web3.utils.randomHex(120)

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

      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should fail if nonce is below required on different wallet', async () => {
      const owner2 = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt2 = encodeImageHash(1, [{ weight: 1, address: owner2.address }])
      await factory.deploy(module.address, salt2)
      const wallet2 = (await MainModuleArtifact.at(addressOf(factory.address, module.address, salt2))) as MainModule

      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      await signAndExecuteMetaTx(wallet2, owner2, stubTxns, networkId)

      const valA = 5423
      const valB = web3.utils.randomHex(120)

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
      await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED'))
    })
    it('Should fail if nonce is below required on self-wallet on a different space', async () => {
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock
      await signAndExecuteMetaTx(wallet, owner, stubTxns, networkId)

      const valA = 5423
      const valB = web3.utils.randomHex(120)

      const transactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: optimalGasLimit,
          target: requireUtils.address,
          value: ethers.constants.Zero,
          data: requireUtils.interface.encodeFunctionData(
            'requireMinNonce', [wallet.address, encodeNonce(ethers.constants.Two, ethers.constants.One)]
          )
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
      await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED'))
    })
    it('Should fail if nonce is below required on self-wallet', async () => {
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      const valA = 5423
      const valB = web3.utils.randomHex(120)

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
      await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#requireMinNonce: NONCE_BELOW_REQUIRED'))
    })
  })
  describe('Expirable transactions', () => {
    it('Should pass if non expired', async () => {
      await requireUtils.requireNonExpired(now() + 1480)
    })
    it('Should fail if expired', async () => {
      const tx = requireUtils.requireNonExpired(now() - 1)
      await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#requireNonExpired: EXPIRED'))
    })
    it('Should pass bundle if non expired', async () => {
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      const valA = 5423
      const valB = web3.utils.randomHex(120)

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
      expect(await callReceiver.lastValA()).to.eq.BN(valA)
      expect(await callReceiver.lastValB()).to.equal(valB)
    })
    it('Should fail bundle if expired', async () => {
      const callReceiver = (await CallReceiverMockArtifact.new()) as CallReceiverMock

      const valA = 5423
      const valB = web3.utils.randomHex(120)

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
      await expect(tx).to.be.rejectedWith(RevertError('RequireUtils#requireNonExpired: EXPIRED'))
    })
  })
})

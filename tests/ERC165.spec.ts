import { ethers } from 'ethers'
import { expect, encodeImageHash, signAndExecuteMetaTx, interfaceIdOf, addressOf } from './utils'

import { MainModule, MainModuleUpgradable, Factory } from 'src/gen/typechain'

import { Factory__factory, MainModule__factory, MainModuleUpgradable__factory, ERC165CheckerMock__factory } from '../src'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

// const FactoryArtifact = artifacts.require('Factory')
// const MainModuleArtifact = artifacts.require('MainModule')
// const Erc165CheckerMockArtifact = artifacts.require('ERC165CheckerMock')
// const MainModuleUpgradableArtifact = artifacts.require('MainModuleUpgradable')
// const MainModuleArtifact2 = artifacts.require('MainModule')


// const FactoryArtifact = require('@0xsequence/wallet-contracts/artifacts/contracts/Factory.sol/Factory.json')
// const GuestModuleArtifact = require('@0xsequence/wallet-contracts/artifacts/contracts/modules/GuestModule.sol/GuestModule.json')
// const MainModuleArtifact = require('@0xsequence/wallet-contracts/artifacts/contracts/modules/MainModule.sol/MainModule.json')
// const MainModuleUpgradableArtifact = require('@0xsequence/wallet-contracts/artifacts/contracts/modules/MainModuleUpgradable.sol/MainModuleUpgradable.json')
// const SequenceUtilsArtifact = require('@0xsequence/wallet-contracts/artifacts/contracts/modules/utils/SequenceUtils.sol/SequenceUtils.json')
// const RequireFreshSignerArtifact = require('@0xsequence/wallet-contracts/artifacts/contracts/modules/utils/libs/RequireFreshSigner.sol/RequireFreshSigner.json')

interface Artifact {
  abi: object[]
  bytecode: string
}

// const FactoryArtifact: Artifact = require('../src/artifacts/contracts/Factory.sol/Factory.json')
// const MainModuleArtifact: Artifact = require('../src/artifacts/contracts/modules/MainModule.sol/MainModule.json')


// console.log('weeeee1')
// console.log(MainModuleArtifact)
// console.log('weeeee2')

import { ethers as hardhat, web3 } from 'hardhat'

const interfaceIds = [
  'IModuleHooks',
  'IERC223Receiver',
  'IERC721Receiver',
  'IERC1155Receiver',
  'IERC1271Wallet',
  'IModuleCalls',
  'IModuleCreator',
  'IModuleHooks',
  'IModuleUpdate'
]

// console.log('FactoryArtifact', FactoryArtifact)

contract('ERC165', () => {
  let provider: ethers.providers.Provider
  let signer: ethers.Signer
  let networkId: number

  let factory: Factory
  let mainModule: MainModule
  let moduleUpgradable: MainModuleUpgradable

  let owner: ethers.Wallet
  let wallet: MainModule

  let erc165checker

  before(async () => {
    // get signer and provider from hardhat
    signer = (await hardhat.getSigners())[0]
    provider = hardhat.provider
    
    // Get network ID
    networkId = process.env.NET_ID ? Number(process.env.NET_ID) : await web3.eth.net.getId()

    // Deploy wallet factory
    factory = await (new Factory__factory()).connect(signer).deploy()
    // Deploy MainModule
    mainModule = await (new MainModule__factory()).connect(signer).deploy(factory.address)
    moduleUpgradable = await (new MainModuleUpgradable__factory()).connect(signer).deploy()
    // Deploy ERC165 Checker
    erc165checker = await (new ERC165CheckerMock__factory()).connect(signer).deploy()
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    await factory.deploy(mainModule.address, salt, { gasLimit: 100_000 })
    wallet = await MainModule__factory.connect(addressOf(factory.address, mainModule.address, salt), signer)
  })

  describe('Implement all interfaces for ERC165 on MainModule', () => {
    interfaceIds.forEach(element => {
      it(`Should return implements ${element} interfaceId`, async () => {
        const interfaceId = interfaceIdOf(new ethers.utils.Interface(artifacts.require(element).abi))
        expect(web3.utils.toBN(interfaceId)).to.not.eq.BN(0)

        const erc165result = await erc165checker.doesContractImplementInterface(wallet.address, interfaceId)
        expect(erc165result).to.be.true
      })
    })
  })
  describe('Implement all interfaces for ERC165 on MainModuleUpgradable', () => {
    beforeEach(async () => {
      const newOwner = new ethers.Wallet(ethers.utils.randomBytes(32))
      const newImageHash = encodeImageHash(1, [{ weight: 1, address: newOwner.address }])
      const newWallet = await MainModuleUpgradable__factory.connect(wallet.address, signer)

      const migrateTransactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.constants.Two.pow(21),
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.interface.encodeFunctionData('updateImplementation', [moduleUpgradable.address])
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.constants.Two.pow(21),
          target: wallet.address,
          value: ethers.constants.Zero,
          data: newWallet.interface.encodeFunctionData('updateImageHash', [newImageHash])
        }
      ]

      await signAndExecuteMetaTx(wallet, owner, migrateTransactions, networkId)
      wallet = newWallet as unknown as MainModule
    })
    interfaceIds.concat('IModuleAuthUpgradable').forEach(element => {
      it(`Should return implements ${element} interfaceId`, async () => {
        const interfaceId = interfaceIdOf(new ethers.utils.Interface(artifacts.require(element).abi))
        expect(web3.utils.toBN(interfaceId)).to.not.eq.BN(0)

        const erc165result = await erc165checker.doesContractImplementInterface(wallet.address, interfaceId)
        expect(erc165result).to.be.true
      })
    })
  })
  describe('Manually defined interfaces', () => {
    const interfaces = [
      ['ERC165', '0x01ffc9a7'],
      ['ERC721', '0x150b7a02'],
      ['ERC1155', '0x4e2312e0']
    ]

    interfaces.forEach(i => {
      it(`Should implement ${i[0]} interface`, async () => {
        const erc165result = await erc165checker.doesContractImplementInterface(wallet.address, i[1])
        expect(erc165result).to.be.true
      })
    })
  })
})

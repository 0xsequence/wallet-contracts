import * as ethers from 'ethers'
import { expect, encodeImageHash, signAndExecuteMetaTx, interfaceIdOf, addressOf } from './utils'

import { MainModule } from 'typings/contracts/MainModule'
import { MainModuleUpgradable } from 'typings/contracts/MainModuleUpgradable'
import { Factory } from 'typings/contracts/Factory'
import { ERC165CheckerMock } from 'typings/contracts/ERC165CheckerMock'


ethers.errors.setLogLevel("error")

const FactoryArtifact = artifacts.require('Factory')
const MainModuleArtifact = artifacts.require('MainModule')
const ERC165CheckerMockArtifact = artifacts.require('ERC165CheckerMock')
const MainModuleUpgradableArtifact = artifacts.require('MainModuleUpgradable')

const web3 = (global as any).web3

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

contract('ERC165', () => {
  let factory
  let module

  let owner
  let wallet

  let moduleUpgradable

  let erc165checker

  let networkId

  before(async () => {
    // Deploy wallet factory
    factory = await FactoryArtifact.new() as Factory
    // Deploy MainModule
    module = await MainModuleArtifact.new(factory.address) as MainModule
    moduleUpgradable = await MainModuleUpgradableArtifact.new() as MainModuleUpgradable
    // Deploy ERC165 Checker
    erc165checker = await ERC165CheckerMockArtifact.new() as ERC165CheckerMock
    // Get network ID
    networkId = await web3.eth.net.getId()
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    await factory.deploy(module.address, salt)
    wallet = await MainModuleArtifact.at(addressOf(factory.address, module.address, salt)) as MainModule
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

      const newWallet = (await MainModuleUpgradableArtifact.at(wallet.address)) as MainModuleUpgradable

      const migrateTransactions = [
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.constants.MaxUint256,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: wallet.contract.methods.updateImplementation(moduleUpgradable.address).encodeABI()
        },
        {
          delegateCall: false,
          revertOnError: true,
          gasLimit: ethers.constants.MaxUint256,
          target: wallet.address,
          value: ethers.constants.Zero,
          data: newWallet.contract.methods.updateImageHash(newImageHash).encodeABI()
        }
      ]

      await signAndExecuteMetaTx(wallet, owner, migrateTransactions, networkId)
      wallet = newWallet
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
})

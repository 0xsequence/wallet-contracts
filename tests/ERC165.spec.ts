import { expect, encodeImageHash, signAndExecuteMetaTx, interfaceIdOf, addressOf } from './utils'
import { MainModule, MainModuleUpgradable, Factory, ERC165CheckerMock, Factory__factory, MainModule__factory, MainModuleUpgradable__factory, ERC165CheckerMock__factory } from 'src/gen/typechain'
import { ethers as hethers } from 'hardhat'
import * as ethers from 'ethers'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

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
  let factoryFactory: Factory__factory
  let mainModuleFactory: MainModule__factory
  let mainModuleUpgradableFactory: MainModuleUpgradable__factory
  let erc165CheckerMockFactory: ERC165CheckerMock__factory

  let factory: Factory
  let module: MainModule
  let moduleUpgradable: MainModuleUpgradable
  let erc165checker: ERC165CheckerMock

  let owner: ethers.Wallet
  let wallet: MainModule | MainModuleUpgradable
  let networkId: ethers.BigNumberish

  before(async () => {
    factoryFactory = await hethers.getContractFactory('Factory') as Factory__factory
    mainModuleFactory = await hethers.getContractFactory('MainModule') as MainModule__factory
    mainModuleUpgradableFactory = await hethers.getContractFactory('MainModuleUpgradable') as MainModuleUpgradable__factory
    erc165CheckerMockFactory = await hethers.getContractFactory('ERC165CheckerMock') as ERC165CheckerMock__factory
  
    factory = await factoryFactory.deploy()
    moduleUpgradable = await mainModuleUpgradableFactory.deploy()
    module = await mainModuleFactory.deploy(factory.address, moduleUpgradable.address)
    erc165checker = await erc165CheckerMockFactory.deploy()

    networkId = process.env.NET_ID ? process.env.NET_ID : hethers.provider.network.chainId
  })

  beforeEach(async () => {
    owner = new ethers.Wallet(ethers.utils.randomBytes(32))
    const salt = encodeImageHash(1, [{ weight: 1, address: owner.address }])
    await factory.deploy(module.address, salt)
    wallet = mainModuleFactory.attach(addressOf(factory.address, module.address, salt))
  })

  describe('Implement all interfaces for ERC165 on MainModule', () => {
    interfaceIds.forEach(element => {
      it(`Should return implements ${element} interfaceId`, async () => {
        const interfaceId = interfaceIdOf(new ethers.utils.Interface(artifacts.require(element).abi))
        expect(ethers.BigNumber.from(interfaceId).isZero()).to.be.false

        const erc165result = await erc165checker.doesContractImplementInterface(wallet.address, interfaceId)
        expect(erc165result).to.be.true
      })
    })
  })
  describe('Implement all interfaces for ERC165 on MainModuleUpgradable', () => {
    beforeEach(async () => {
      const newOwner = new ethers.Wallet(ethers.utils.randomBytes(32))
      const newImageHash = encodeImageHash(1, [{ weight: 1, address: newOwner.address }])

      const newWallet = mainModuleUpgradableFactory.attach(wallet.address)

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
      wallet = newWallet
    })

    interfaceIds.concat('IModuleAuthUpgradable').forEach(element => {
      it(`Should return implements ${element} interfaceId`, async () => {
        const interfaceId = interfaceIdOf(new ethers.utils.Interface(artifacts.require(element).abi))
        expect(ethers.BigNumber.from(interfaceId).isZero()).to.be.false

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

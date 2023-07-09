import * as ethers from 'ethers'
import { ContractType, deploySequenceContext, ERC165CheckerMock, SequenceContext } from './utils/contracts'
import { SequenceWallet } from './utils/wallet'
import { expect, interfaceIdOf, randomHex } from './utils'

const interfaceIds = [
  'IERC223Receiver',
  'IERC721Receiver',
  'IERC1155Receiver',
  'IERC1271Wallet',
  'IModuleAuth',
  'IModuleCalls',
  'IModuleCreator',
  'IModuleHooks',
  'IModuleUpdate'
]

contract('ERC165', () => {
  let context: SequenceContext
  let erc165checker: ContractType<typeof ERC165CheckerMock>
  let wallet: SequenceWallet

  before(async () => {
    context = await deploySequenceContext()
    erc165checker = await ERC165CheckerMock.deploy()
  })

  beforeEach(async () => {
    wallet = SequenceWallet.basicWallet(context)
    await wallet.deploy()
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
      await wallet.updateImageHash(randomHex(32))
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

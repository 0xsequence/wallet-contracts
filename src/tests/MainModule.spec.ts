import * as ethers from 'ethers'
import { expect, ethSign, encodeMetaTransactionsData, RevertError, MetaAction } from './utils';
ethers.errors.setLogLevel("error")

const Factory = artifacts.require('Factory')
const MainModule = artifacts.require('MainModule')
const MainModuleDeployer = artifacts.require('MainModuleDeployer')

const web3 = (global as any).web3

contract('MainModule', (accounts: string[]) => {
  let factory
  let module

  before(async () => {
    // Deploy wallet factory
    factory = await Factory.new()
    // Deploy MainModule
    const tx = await (await MainModuleDeployer.new()).deploy(factory.address)
    module = await MainModule.at(tx.logs[0].args._module)
  })

  describe('Authentication', () => {
    it('Should accept initial owner signature', async () => {
      const owner = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt = web3.utils.padLeft(owner.address, 64)
      await factory.deploy(module.address, salt)
      const wallet = await MainModule.at(await factory.addressOf(module.address, salt))

      const nonce = ethers.constants.One

      const transaction = {
        action: MetaAction.external,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      const transactionsData = encodeMetaTransactionsData(wallet.address, [transaction], nonce)

      const signature = ethers.utils.solidityPack(
        ['bytes', 'uint256', 'uint8'],
        [await ethSign(owner, transactionsData), nonce, '2']
      )

      await wallet.execute([transaction], signature)
    })
    it('Should reject non-owner signature', async () => {
      const owner = new ethers.Wallet(ethers.utils.randomBytes(32))
      const salt = web3.utils.padLeft(owner.address, 64)
      await factory.deploy(module.address, salt)
      const wallet = await MainModule.at(await factory.addressOf(module.address, salt))

      const impostor = new ethers.Wallet(ethers.utils.randomBytes(32))

      const nonce = ethers.constants.One

      const transaction = {
        action: MetaAction.external,
        target: ethers.constants.AddressZero,
        value: ethers.constants.Zero,
        data: []
      }

      const transactionsData = encodeMetaTransactionsData(wallet.address, [transaction], nonce)

      const signature = ethers.utils.solidityPack(
        ['bytes', 'uint256', 'uint8'],
        [await ethSign(impostor, transactionsData), nonce, '2']
      )

      const tx = wallet.execute([transaction], signature)
      await expect(tx).to.be.rejectedWith(RevertError("MainModule#_signatureValidation: INVALID_SIGNATURE"))
    })
  })
})

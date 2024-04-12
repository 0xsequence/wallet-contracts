import { ethers } from 'ethers'

import { ethers as hethers } from 'hardhat'
import { addressOf } from './utils/sequence'
import { expect, expectToBeRejected } from './utils'
import { ContractType, Factory, ModuleMock } from './utils/contracts'

contract('Factory', () => {
  let module: ContractType<typeof ModuleMock>
  let factory: ContractType<typeof Factory>

  beforeEach(async () => {
    module = await ModuleMock.deploy()
    factory = await Factory.deploy()

    await module.waitForDeployment()
    await factory.waitForDeployment()
  })

  describe('Deploy wallets', () => {
    it('Should deploy wallet', async () => {
      await factory.deploy(
        await module.getAddress(),
        ethers.AbiCoder.defaultAbiCoder().encode(['address'], [ethers.Wallet.createRandom().address])
      )
      await factory.waitForDeployment()
    })

    it('Should predict wallet address', async () => {
      const hash = ethers.hexlify(ethers.randomBytes(32))
      const predict = addressOf(await factory.getAddress(), await module.getAddress(), hash)
      await factory.deploy(await module.getAddress(), hash)
      await factory.waitForDeployment()
      expect(await hethers.provider.getCode(predict)).to.not.equal('0x')
    })

    it('Should initialize with main module', async () => {
      const hash = ethers.hexlify(ethers.randomBytes(32))
      await factory.deploy(await module.getAddress(), hash)
      const address = addressOf(await factory.getAddress(), await module.getAddress(), hash)
      const wallet = await ModuleMock.attach(address)
      const receipt = await (await wallet.ping()).wait()

      if (!receipt) {
        throw new Error('No receipt')
      }

      expect(wallet.interface.parseLog(receipt.logs[0])?.name).to.equal('Pong')
    })

    it('Should fail to deploy twice', async () => {
      const hash = ethers.hexlify(ethers.randomBytes(32))
      await factory.deploy(await module.getAddress(), hash)

      const tx2 = factory.deploy(await module.getAddress(), hash)
      await expectToBeRejected(tx2, `DeployFailed("${await module.getAddress()}", "${hash}")`)
    })

    it('Should fail to deploy with not enough gas', async () => {
      const hash = ethers.hexlify(ethers.randomBytes(32))
      const tx = factory.deploy(await module.getAddress(), hash, { gasLimit: 80000 })
      await expectToBeRejected(tx, `DeployFailed("${await module.getAddress()}", "${hash}")`)
    })
  })
})

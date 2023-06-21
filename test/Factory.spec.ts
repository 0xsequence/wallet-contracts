import * as ethers from 'ethers'

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
  })

  describe('Deploy wallets', () => {
    it('Should deploy wallet', async () => {
      await factory.deploy(module.address, ethers.utils.defaultAbiCoder.encode(['address'], [ethers.Wallet.createRandom().address]))
    })

    it('Should predict wallet address', async () => {
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      const predict = addressOf(factory.address, module.address, hash)
      await factory.deploy(module.address, hash)
      expect(await hethers.provider.getCode(predict)).to.not.equal('0x')
    })

    it('Should initialize with main module', async () => {
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      await factory.deploy(module.address, hash)
      const address = addressOf(factory.address, module.address, hash)
      const wallet = await ModuleMock.attach(address)
      const receipt = await (await wallet.ping()).wait()
      expect(wallet.interface.parseLog(receipt.logs[0]).name).to.equal('Pong')
    })

    it('Should fail to deploy twice', async () => {
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      await factory.deploy(module.address, hash)

      const tx2 = factory.deploy(module.address, hash)
      await expectToBeRejected(tx2, `DeployFailed("${module.address}", "${hash}")`)
    })

    it('Should fail to deploy with not enough gas', async () => {
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      const tx = factory.deploy(module.address, hash, { gasLimit: 80000 })
      await expectToBeRejected(tx, `DeployFailed("${module.address}", "${hash}")`)
    })
  })
})

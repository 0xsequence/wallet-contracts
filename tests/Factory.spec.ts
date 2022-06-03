import { expect, addressOf } from './utils'
import { ModuleMock, Factory, Factory__factory, ModuleMock__factory } from 'src/gen/typechain'
import { ethers as hethers } from 'hardhat'
import * as ethers from 'ethers'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)


import { web3 } from 'hardhat'

contract('Factory', (accounts: string[]) => {
  let moduleFactory: ModuleMock__factory
  let factoryFactory: Factory__factory

  let module: ModuleMock
  let factory: Factory

  beforeEach(async () => {
    factoryFactory = await hethers.getContractFactory('Factory') as Factory__factory
    moduleFactory = await hethers.getContractFactory('ModuleMock') as ModuleMock__factory

    factory = await factoryFactory.deploy()
    module = await moduleFactory.deploy()
  })

  describe('Deploy wallets', () => {
    it('Should deploy wallet', async () => {
      await factory.deploy(module.address, ethers.utils.defaultAbiCoder.encode(['address'], [accounts[0]]))
    })
    it('Should predict wallet address', async () => {
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      const predict = addressOf(factory.address, module.address, hash)
      await factory.deploy(module.address, hash)
      expect(await web3.eth.getCode(predict)).to.not.equal('0x')
    })
    it('Should initialize with main module', async () => {
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      await factory.deploy(module.address, hash)
      const address = addressOf(factory.address, module.address, hash)
      const wallet = moduleFactory.attach(address)
      const receipt = await (await wallet.ping()).wait()
      expect(wallet.interface.parseLog(receipt.logs[0]).name).to.equal('Pong')
    })
  })
})

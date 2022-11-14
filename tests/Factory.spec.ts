import { ethers as hardhat, web3 } from 'hardhat'
import { ethers } from 'ethers'
import { expect, addressOf } from './utils'

import { ModuleMock, Factory, ModuleMock__factory, Factory__factory } from '../src'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

contract('Factory', (accounts: string[]) => {
  let signer: ethers.Signer
  let moduleMock: ModuleMock
  let factory: Factory

  beforeEach(async () => {
    signer = (await hardhat.getSigners())[0]
    moduleMock = await (new ModuleMock__factory()).connect(signer).deploy()
    factory = await (new Factory__factory()).connect(signer).deploy()
  })

  describe('Deploy wallets', () => {
    it('Should deploy wallet', async () => {
      // const saltHash = encodeImageHash(1, [{ weight: 1, address: accounts[0] }])
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      await factory.deploy(moduleMock.address, hash, { gasLimit: 100_000 })
    })
    it('Should predict wallet address', async () => {
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      const predict = addressOf(factory.address, moduleMock.address, hash)
      await factory.deploy(moduleMock.address, hash, { gasLimit: 100_000 })
      expect(await web3.eth.getCode(predict)).to.not.equal('0x')
    })
    it('Should initialize with main module', async () => {
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      await factory.deploy(moduleMock.address, hash, { gasLimit: 100_000 })
      const address = addressOf(factory.address, moduleMock.address, hash)
      const wallet = await ModuleMock__factory.connect(address, signer)
      const receipt = await (await wallet.ping()).wait()
      expect(receipt.events![0].event).to.equal('Pong')
    })
  })
})

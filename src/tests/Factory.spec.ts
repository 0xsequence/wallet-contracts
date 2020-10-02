import * as ethers from 'ethers'
import { expect, addressOf } from './utils';

import { ModuleMock } from 'typings/contracts/ethers-v4/ModuleMock'
import { Factory } from 'typings/contracts/ethers-v4/Factory'

ethers.errors.setLogLevel("error")

const FactoryArtifact = artifacts.require('Factory');
const ModuleMockArtifact = artifacts.require('ModuleMock');

const web3 = (global as any).web3

contract('Factory', (accounts: string[]) => {
  let module
  let factory

  beforeEach(async () => {
    module        = await ModuleMockArtifact.new() as ModuleMock
    factory       = await FactoryArtifact.new() as Factory
  })

  describe('Deploy wallets', () => {
    it('Should deploy wallet', async () => {
      await factory.deploy(module.address, accounts[0])
    })
    it('Should predict wallet address', async () => {
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      const predict = addressOf(factory.address, module.address, hash)
      await factory.deploy(module.address, hash)
      expect(await web3.eth.getCode(predict)).to.not.equal("0x")
    })
    it('Should initialize with main module', async () => {
      const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      await factory.deploy(module.address, hash)
      const address = addressOf(factory.address, module.address, hash)
      const wallet = await ModuleMockArtifact.at(address) as ModuleMock
      expect(((await wallet.ping()) as any).logs[0].event).to.equal("Pong")
    })
  })
})

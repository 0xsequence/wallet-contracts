import * as ethers from 'ethers'
import { expect } from './utils';

import { ModuleMock } from 'typings/contracts/ModuleMock'
import { Factory } from 'typings/contracts/Factory'

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
      const predict = await factory.addressOf(module.address, accounts[0])
      await factory.deploy(module.address, accounts[0])
      expect(await web3.eth.getCode(predict)).to.not.equal("0x")
    })
    it('Should initialize with main module', async () => {
      await factory.deploy(module.address, accounts[0])
      const address = await factory.addressOf(module.address, accounts[0])
      const wallet = await ModuleMockArtifact.at(address) as ModuleMock
      expect(((await wallet.ping()) as any).logs[0].event).to.equal("Pong")
    })
  })
})

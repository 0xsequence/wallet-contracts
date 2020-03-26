import * as ethers from 'ethers'
import { expect } from './utils';
ethers.errors.setLogLevel("error")

const Factory = artifacts.require('Factory');
const ModuleMock = artifacts.require('ModuleMock');

const web3 = (global as any).web3

contract('Factory', (accounts: string[]) => {
  let module
  let factory

  beforeEach(async () => {
    module        = await ModuleMock.new()
    factory       = await Factory.new()
  })

  describe('Deploy wallets', () => {
    it('Should deploy wallet', async () => {
      await factory.deploy(module.address, accounts[0])
    })
    it('Should predict wallet address', async () => {
      const predict = await factory.addressOf(module.address, accounts[0])
      await factory.deploy(module.address, accounts[0])
      expect(await web3.eth.getCode(predict)).to.not.eq("0x")
    })
    it('Should initialize with main module', async () => {
      await factory.deploy(module.address, accounts[0])
      const wallet = await ModuleMock.at(await factory.addressOf(module.address, accounts[0]))
      expect((await wallet.ping()).logs[0].event).to.eq("Pong")
    })
  })
})

import * as ethers from 'ethers'
import { expect } from './utils';
ethers.errors.setLogLevel("error")

const Factory = artifacts.require('Factory');
const WalletFactory = artifacts.require('WalletFactory');
const ModuleMock = artifacts.require('ModuleMock');

const web3 = (global as any).web3

contract('GoldCardsFactory', (accounts: string[]) => {
  let module
  let factory
  let walletFactory

  beforeEach(async () => {
    module        = await ModuleMock.new()
    factory       = await Factory.new()
    walletFactory = await WalletFactory.new(factory.address, module.address)
  })

  describe('Deploy wallets', () => {
    it('Should deploy wallet', async () => {
      await walletFactory.deploy(accounts[0])
    })
    it('Should predict wallet address', async () => {
      const predict = await walletFactory.addressOf(accounts[0])
      await walletFactory.deploy(accounts[0])
      expect(await web3.eth.getCode(predict)).to.not.eq("0x")
    })
    it('Should initialize with main module', async () => {
      await walletFactory.deploy(accounts[0])
      const wallet = await ModuleMock.at(await walletFactory.addressOf(accounts[0]))
      expect((await wallet.ping()).logs[0].event).to.eq("Pong")
    })
  })
})

import * as ethers from 'ethers'
import { expect } from './utils';
ethers.errors.setLogLevel("error")

const Factory = artifacts.require('Factory')
const MainModule = artifacts.require('MainModule')
const MainModuleDeployer = artifacts.require('MainModuleDeployer')

const web3 = (global as any).web3

contract('MainModuleDeployer', (accounts: string[]) => {
  let factory

  beforeEach(async () => {
    factory = await Factory.new()
  })

  it('Should deploy MainModule with provided factory', async () => {
    const tx = await (await MainModuleDeployer.new()).deploy(factory.address)
    const module = await MainModule.at(tx.logs[0].args._module)
    expect(await module.FACTORY()).to.equal(factory.address)
  })

  it('Should deploy MainModule with derived initCodeHash', async () => {
    const tx = await (await MainModuleDeployer.new()).deploy(factory.address)
    const module = await MainModule.at(tx.logs[0].args._module)
    expect(await module.INIT_CODE_HASH()).to.equal(tx.logs[0].args._initCodeHash)
  })
})

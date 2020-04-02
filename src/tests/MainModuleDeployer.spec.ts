import * as ethers from 'ethers'
import { expect } from './utils';

import { Factory } from 'typings/contracts/Factory'

ethers.errors.setLogLevel("error")

const FactoryArtifact = artifacts.require('Factory')
const MainModuleArtifact = artifacts.require('MainModule')
const MainModuleDeployerArtifact = artifacts.require('MainModuleDeployer')

const web3 = (global as any).web3

contract('MainModuleDeployer', (accounts: string[]) => {
  let factory

  beforeEach(async () => {
    factory = await FactoryArtifact.new() as Factory
  })

  it('Should deploy MainModule with provided factory', async () => {
    const tx = await (await MainModuleDeployerArtifact.new()).deploy(factory.address)
    const module = await MainModuleArtifact.at(tx.logs[0].args._module)
    expect(await module.FACTORY()).to.equal(factory.address)
  })

  it('Should deploy MainModule with derived initCodeHash', async () => {
    const tx = await (await MainModuleDeployerArtifact.new()).deploy(factory.address)
    const module = await MainModuleArtifact.at(tx.logs[0].args._module)
    expect(await module.INIT_CODE_HASH()).to.equal(tx.logs[0].args._initCodeHash)
  })
})

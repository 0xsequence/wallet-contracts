import { network } from '@nomiclabs/buidler'
import * as _ from 'lodash'
import ora from 'ora'

const web3 = (global as any).web3

import { MainModuleFactory } from '../../typings/contracts/ethers-v4/MainModuleFactory'
import { SequenceUtilsFactory } from '../../typings/contracts/ethers-v4/SequenceUtilsFactory'
import { MainModuleUpgradableFactory } from '../../typings/contracts/ethers-v4/MainModuleUpgradableFactory'
import { GuestModuleFactory } from '../../typings/contracts/ethers-v4/GuestModuleFactory'
import { FactoryFactory } from '../../typings/contracts/ethers-v4/FactoryFactory'
import { UniversalDeployer } from '@arcadeum/deployer'
import { Web3Provider } from 'ethers/providers'
import { BigNumber } from 'ethers/utils'

const prompt = ora()

/**
 * @notice Deploy core wallet contracts via universal deployer
 * 
 *   1. Deploy Wallet Factory via UD
 *   2. Deploy Main Module via UD
 *   3. Deploy Upgradable Main Module via UD
 *   4. Deploy Guest Module via UD
 */

const provider = new Web3Provider(web3.currentProvider)
const signer = provider.getSigner()
const universalDeployer = new UniversalDeployer(network.name, signer)
const txParams = {gasLimit: 8000000, gasPrice: new BigNumber(10).pow(9).mul(10)}

const main = async () => {
  prompt.info(`Network Name:           ${network.name}`)
  prompt.info(`Local Deployer Address: ${await signer.getAddress()}`)
  prompt.info(`Local Deployer Balance: ${await signer.getBalance()}`)

  const walletFactory = await universalDeployer.deploy('WalletFactory', FactoryFactory, txParams)
  const mainModule = await universalDeployer.deploy('MainModule', MainModuleFactory, txParams, 0, walletFactory.address)
  await universalDeployer.deploy('MainModuleUpgradable', MainModuleUpgradableFactory, txParams)
  await universalDeployer.deploy('GuestModule', GuestModuleFactory, txParams)
  await universalDeployer.deploy('SequenceUtils', SequenceUtilsFactory, txParams, 0, walletFactory.address, mainModule.address)

  prompt.start(`writing deployment information to ${network.name}.json`)
  await universalDeployer.registerDeployment()
  prompt.succeed()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

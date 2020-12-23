import { network, web3 } from 'hardhat'
import * as _ from 'lodash'
import ora from 'ora'

import {
  MainModule__factory,
  SequenceUtils__factory,
  MainModuleUpgradable__factory,
  GuestModule__factory,
  Factory__factory
} from 'typings/contracts/ethers-v5'

import { UniversalDeployer } from '@arcadeum/deployer'
import { providers } from 'ethers'
import { BigNumber } from 'ethers'

const prompt = ora()

/**
 * @notice Deploy core wallet contracts via universal deployer
 * 
 *   1. Deploy Wallet Factory via UD
 *   2. Deploy Main Module via UD
 *   3. Deploy Upgradable Main Module via UD
 *   4. Deploy Guest Module via UD
 */

const provider = new providers.Web3Provider(web3.currentProvider)
const signer = provider.getSigner()
const universalDeployer = new UniversalDeployer(network.name, signer)
const txParams = {gasLimit: 8000000, gasPrice: BigNumber.from(10).pow(9).mul(10)}

const main = async () => {
  prompt.info(`Network Name:           ${network.name}`)
  prompt.info(`Local Deployer Address: ${await signer.getAddress()}`)
  prompt.info(`Local Deployer Balance: ${await signer.getBalance()}`)

  const walletFactory = await universalDeployer.deploy('WalletFactory', Factory__factory, txParams)
  const mainModule = await universalDeployer.deploy('MainModule', MainModule__factory, txParams, 0, walletFactory.address)
  await universalDeployer.deploy('MainModuleUpgradable', MainModuleUpgradable__factory, txParams)
  await universalDeployer.deploy('GuestModule', GuestModule__factory, txParams)
  await universalDeployer.deploy('SequenceUtils', SequenceUtils__factory, txParams, 0, walletFactory.address, mainModule.address)

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

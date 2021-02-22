import { network, web3, run, config } from 'hardhat'
import * as _ from 'lodash'
import ora from 'ora'

import {
  MainModule__factory,
  SequenceUtils__factory,
  MainModuleUpgradable__factory,
  GuestModule__factory,
  Factory__factory
} from '../typings/contracts'

import { UniversalDeployer } from '@arcadeum/deployer'
import { ContractFactory, BigNumber, providers } from 'ethers'

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
const txParams = {
  gasLimit: 6000000,
  gasPrice: BigNumber.from(10)
    .pow(9)
    .mul(16)
}

const attempVerify = async <T extends ContractFactory>(_: new () => T, address: string, ...args: Parameters<T["deploy"]>) => {
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: args,
    })
  } catch {}
}

const main = async () => {
  prompt.info(`Network Name:           ${network.name}`)
  prompt.info(`Local Deployer Address: ${await signer.getAddress()}`)
  prompt.info(`Local Deployer Balance: ${await signer.getBalance()}`)

  const walletFactory = await universalDeployer.deploy('WalletFactory', Factory__factory, txParams)
  const mainModule = await universalDeployer.deploy('MainModule', MainModule__factory, txParams, 0, walletFactory.address)
  const mainModuleUpgradeable = await universalDeployer.deploy('MainModuleUpgradable', MainModuleUpgradable__factory, txParams)
  const guestModule = await universalDeployer.deploy('GuestModule', GuestModule__factory, txParams)
  const sequenceUtils = await universalDeployer.deploy('SequenceUtils', SequenceUtils__factory, txParams, 0, walletFactory.address, mainModule.address)

  prompt.start(`writing deployment information to ${network.name}.json`)
  await universalDeployer.registerDeployment()
  prompt.succeed()

  if (config.etherscan) {
    prompt.start(`verifying contracts on etherscan`)

    await attempVerify(Factory__factory, walletFactory.address)
    await attempVerify(MainModule__factory, mainModule.address, walletFactory.address)
    await attempVerify(MainModuleUpgradable__factory, mainModuleUpgradeable.address)
    await attempVerify(GuestModule__factory, guestModule.address)
    await attempVerify(SequenceUtils__factory, sequenceUtils.address, walletFactory.address, mainModule.address)

    prompt.succeed()
  }
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

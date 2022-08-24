import { network, run, tenderly } from 'hardhat'
import * as _ from 'lodash'
import ora from 'ora'

import {
  MainModule__factory,
  SequenceUtils__factory,
  MainModuleUpgradable__factory,
  GuestModule__factory,
  Factory__factory,
  RequireFreshSigner__factory
} from '../src/gen/typechain'

import { UniversalDeployer } from '@0xsequence/deployer'
import { ContractFactory, BigNumber, providers } from 'ethers'
import fs from 'fs'

const prompt = ora()

/**
 * @notice Deploy core wallet contracts via universal deployer
 *
 *   1. Deploy Wallet Factory via UD
 *   2. Deploy Main Module via UD
 *   3. Deploy Upgradable Main Module via UD
 *   4. Deploy Guest Module via UD
 */

const provider = new providers.Web3Provider(network.provider.send)
const signer = provider.getSigner()
const universalDeployer = new UniversalDeployer(network.name, signer.provider)
const txParams = {
  gasLimit: 6000000,
  gasPrice: BigNumber.from(10)
    .pow(9)
    .mul(16)
}

const attempVerify = async <T extends ContractFactory>(name: string, _: new () => T, address: string, ...args: Parameters<T["deploy"]>) => {
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: args,
    })
  } catch {}

  try {
    await tenderly.verify({
      name: name,
      address: address
    })
  } catch {}
}

const buildNetworkJson = (...contracts: { name: string, address: string }[]) => {
  return contracts.map((c) => ({
    contractName: c.name,
    address: c.address
  }))
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
  const requireFreshSignerLib = await universalDeployer.deploy('RequireFreshSignerLib', RequireFreshSigner__factory, txParams, 0, sequenceUtils.address)

  prompt.start(`writing deployment information to ${network.name}.json`)
  fs.writeFileSync(`./src/networks/${network.name}.json`, JSON.stringify(buildNetworkJson(
    { name: "WalletFactory", address: walletFactory.address },
    { name: "MainModule", address: mainModule.address },
    { name: "MainModuleUpgradable", address: mainModuleUpgradeable.address },
    { name: "GuestModule", address: guestModule.address },
    { name: "SequenceUtils", address: sequenceUtils.address },
    { name: "RequireFreshSignerLib", address: requireFreshSignerLib.address }
  ), null, 2))
  prompt.succeed()

  prompt.start(`verifying contracts`)

  await attempVerify("Factory", Factory__factory, walletFactory.address)
  await attempVerify("MainModule", MainModule__factory, mainModule.address, walletFactory.address)
  await attempVerify("MainModuleUpgradable", MainModuleUpgradable__factory, mainModuleUpgradeable.address)
  await attempVerify("GuestModule", GuestModule__factory, guestModule.address)
  await attempVerify("SequenceUtils", SequenceUtils__factory, sequenceUtils.address, walletFactory.address, mainModule.address)
  await attempVerify("RequireFreshSignerLib", RequireFreshSigner__factory, requireFreshSignerLib.address, sequenceUtils.address)

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

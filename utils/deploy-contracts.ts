import { network, run, tenderly, ethers as hethers } from 'hardhat'
import * as _ from 'lodash'
import ora from 'ora'

import {
  MainModule__factory,
  SequenceUtils__factory,
  MainModuleUpgradable__factory,
  GuestModule__factory,
  Factory__factory
} from '../gen/typechain'

import { ContractFactory, ethers } from 'ethers'
import fs from 'fs'

const provider = hethers.provider
const signer = provider.getSigner(0)

const singletonFactoryFactory = {
  address: '0xce0042B868300000d44A59004Da54A005ffdcf9f',
  abi: [{
    "constant": false,
    "inputs": [{
      "internalType": "bytes",
      "type": "bytes"
    }, {
      "internalType": "bytes32",
      "type": "bytes32"
    }],
    "name": "deploy",
    "outputs": [{
      "internalType": "address payable",
      "type": "address"
    }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }]
}

const prompt = ora()
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
      address: address,
    })
  } catch {}
}

const buildNetworkJson = (...contracts: { name: string, address: string }[]) => {
  return contracts.map((c) => ({
    contractName: c.name,
    address: c.address
  }))
}

type simpleContractFactory<Y extends Array<any>> = {
  getDeployTransaction: (...args: Y) => { data?: ethers.BytesLike },
  attach: (address: string) => ethers.Contract
}

const deploy = async <T extends simpleContractFactory<Y>, Y extends Array<any>>(name: string, contract: new (...args: [signer: ethers.Signer]) => T, ...args: Y): Promise<ethers.Contract> => {
  const singletonFactory = new ethers.Contract(singletonFactoryFactory.address, singletonFactoryFactory.abi, signer)  

  const o = ora().start(`Deploying ${name}`)
  const c = new contract(signer)
  const { data } = c.getDeployTransaction(...args)

  if (!data) {
    throw new Error(`no data for ${name}`)
  }

  const maxGasLimit = await provider.getBlock('latest').then((b) => b.gasLimit.mul(4).div(10))

  const address = ethers.utils.getAddress(ethers.utils.hexDataSlice(
    ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ['bytes1', 'address', 'bytes32', 'bytes32'],
        ['0xff', singletonFactory.address, ethers.constants.HashZero, ethers.utils.keccak256(data)]
      )
    )
  , 12))

  if (ethers.utils.arrayify(await provider.getCode(address)).length > 0) {
    o.succeed(`Skipping ${name} because it has been deployed at ${address}`)
    return c.attach(address)
  }

  await singletonFactory.deploy(data, ethers.constants.HashZero, { gasLimit: maxGasLimit }).then((tx) => tx.wait())

  if (ethers.utils.arrayify(await provider.getCode(address)).length === 0) {
    throw new Error(`failed to deploy ${name}`)
  }

  o.succeed(`Deployed ${name} at ${address}`)

  return c.attach(address)
}


const main = async () => {
  prompt.info(`Network Name:           ${network.name}`)
  prompt.info(`Local Deployer Address: ${await signer.getAddress()}`)
  prompt.info(`Local Deployer Balance: ${await signer.getBalance()}`)

  const walletFactory = await deploy("Factory", Factory__factory)
  const mainModuleUpgradeable = await deploy("MainModuleUpgradable", MainModuleUpgradable__factory)
  const mainModule = await deploy("MainModule", MainModule__factory, walletFactory.address, mainModuleUpgradeable.address)
  const guestModule = await deploy("GuestModule", GuestModule__factory)
  const sequenceUtils = await deploy("SequenceUtils", SequenceUtils__factory)

  prompt.start(`writing deployment information to ${network.name}.json`)
  fs.writeFileSync(`./networks/${network.name}.json`, JSON.stringify(buildNetworkJson(
    { name: "WalletFactory", address: walletFactory.address },
    { name: "MainModule", address: mainModule.address },
    { name: "MainModuleUpgradable", address: mainModuleUpgradeable.address },
    { name: "GuestModule", address: guestModule.address },
    { name: "SequenceUtils", address: sequenceUtils.address }
  ), null, 2))
  prompt.succeed()

  prompt.start(`verifying contracts`)

  await attempVerify("Factory", Factory__factory, walletFactory.address)
  await attempVerify("MainModuleUpgradable", MainModuleUpgradable__factory, mainModuleUpgradeable.address)
  await attempVerify("MainModule", MainModule__factory, mainModule.address, walletFactory.address, mainModuleUpgradeable.address)
  await attempVerify("GuestModule", GuestModule__factory, guestModule.address)
  await attempVerify("SequenceUtils", SequenceUtils__factory, sequenceUtils.address)

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
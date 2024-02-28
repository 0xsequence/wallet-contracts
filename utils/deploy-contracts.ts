import { network, run, tenderly, ethers as hethers } from 'hardhat'
import ora from 'ora'

import {
  MainModule__factory,
  SequenceUtils__factory,
  MainModuleUpgradable__factory,
  GuestModule__factory,
  Factory__factory,
  TrustFactory__factory
} from '../gen/typechain'

import { ContractDeployTransaction, ContractFactory, Signer, ethers } from 'ethers'
import fs from 'fs'

const provider = hethers.provider

const singletonFactoryFactory = {
  address: '0xce0042B868300000d44A59004Da54A005ffdcf9f',
  abi: [
    {
      constant: false,
      inputs: [
        {
          internalType: 'bytes',
          type: 'bytes'
        },
        {
          internalType: 'bytes32',
          type: 'bytes32'
        }
      ],
      name: 'deploy',
      outputs: [
        {
          internalType: 'address payable',
          type: 'address'
        }
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
}
const singletonFactoryDeployTx =
  '0xf9016c8085174876e8008303c4d88080b90154608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c634300060200331b83247000822470'
const singletonFactoryDeployer = '0xBb6e024b9cFFACB947A71991E386681B1Cd1477D'

const prompt = ora()
const attempVerify = async <T extends ContractFactory>(
  name: string,
  _: new () => T,
  address: string,
  ...args: Parameters<T['deploy']>
) => {
  try {
    await run('verify:verify', {
      address: address,
      constructorArguments: args
    })
  } catch {}

  try {
    await tenderly.verify({
      name: name,
      address: address
    })
  } catch {}
}

const buildNetworkJson = (...contracts: { name: string; address: string }[]) => {
  return contracts.map(c => ({
    contractName: c.name,
    address: c.address
  }))
}

const deploy = async (
  name: string,
  contract: new (...args: [signer?: Signer]) => ContractFactory,
  ...args: any[]
): Promise<ethers.BaseContract> => {
  const signer = await provider.getSigner(0)
  const singletonFactory = new ethers.Contract(singletonFactoryFactory.address, singletonFactoryFactory.abi, signer)

  if (ethers.getBytes(await provider.getCode(await singletonFactory.getAddress())).length <= 2) {
    // Deploy singleton deployer
    const o = ora().start(`Deploying singleton factory`)
    const deployerBal = 24700000000000000n
    if ((await provider.getBalance(singletonFactoryDeployer)) < deployerBal) {
      o.info('Funding singleton factory deployer')
      const tx = await signer.sendTransaction({
        to: singletonFactoryDeployer,
        value: deployerBal
      })
      await tx.wait()
      o.info('Funded. Deploying singleton factory')
    }
    const tx = await provider.broadcastTransaction(singletonFactoryDeployTx)
    await tx.wait()
    o.succeed(`Deployed singleton factory`)
  }

  const o = ora().start(`Deploying ${name}`)
  const c = new contract(signer)
  const { data } = await c.getDeployTransaction(...args)

  if (!data) {
    throw new Error(`no data for ${name}`)
  }

  const maxGasLimit = await provider.getBlock('latest').then(b => (b!.gasLimit * 4n) / 10n)

  const address = ethers.getAddress(
    ethers.dataSlice(
      ethers.keccak256(
        ethers.solidityPacked(
          ['bytes1', 'address', 'bytes32', 'bytes32'],
          ['0xff', await singletonFactory.getAddress(), ethers.ZeroHash, ethers.keccak256(data)]
        )
      ),
      12
    )
  )

  if (ethers.getBytes(await provider.getCode(address)).length > 0) {
    o.succeed(`Skipping ${name} because it has been deployed at ${address}`)
    return c.attach(address)
  }

  await singletonFactory.deploy(data, ethers.ZeroHash, { gasLimit: maxGasLimit }).then(tx => tx.wait())

  if (ethers.getBytes(await provider.getCode(address)).length === 0) {
    throw new Error(`failed to deploy ${name}`)
  }

  o.succeed(`Deployed ${name} at ${address}`)

  return c.attach(address)
}

const main = async () => {
  const signer = await provider.getSigner(0)
  const address = await signer.getAddress()
  prompt.info(`Network Name:           ${network.name}`)
  prompt.info(`Local Deployer Address: ${address}`)
  prompt.info(`Local Deployer Balance: ${await provider.getBalance(address)}`)

  const walletFactory = await deploy('Factory', Factory__factory)
  const mainModuleUpgradeable = await deploy('MainModuleUpgradable', MainModuleUpgradable__factory)
  const mainModule = await deploy(
    'MainModule',
    MainModule__factory,
    await walletFactory.getAddress(),
    await mainModuleUpgradeable.getAddress()
  )
  const guestModule = await deploy('GuestModule', GuestModule__factory)
  const sequenceUtils = await deploy('SequenceUtils', SequenceUtils__factory)
  const trustFactory = await deploy('TrustFactory', TrustFactory__factory)

  prompt.start(`writing deployment information to ${network.name}.json`)
  fs.writeFileSync(
    `./networks/${network.name}.json`,
    JSON.stringify(
      buildNetworkJson(
        { name: 'WalletFactory', address: await walletFactory.getAddress() },
        { name: 'MainModule', address: await mainModule.getAddress() },
        { name: 'MainModuleUpgradable', address: await mainModuleUpgradeable.getAddress() },
        { name: 'GuestModule', address: await guestModule.getAddress() },
        { name: 'SequenceUtils', address: await sequenceUtils.getAddress() },
        { name: 'TrustFactory', address: await trustFactory.getAddress() }
      ),
      null,
      2
    )
  )
  prompt.succeed()

  prompt.start(`verifying contracts`)

  await attempVerify('Factory', Factory__factory, await walletFactory.getAddress())
  await attempVerify('MainModuleUpgradable', MainModuleUpgradable__factory, await mainModuleUpgradeable.getAddress())
  await attempVerify(
    'MainModule',
    MainModule__factory,
    await mainModule.getAddress(),
    await walletFactory.getAddress(),
    await mainModuleUpgradeable.getAddress()
  )
  await attempVerify('GuestModule', GuestModule__factory, await guestModule.getAddress())
  await attempVerify('SequenceUtils', SequenceUtils__factory, await sequenceUtils.getAddress())
  await attempVerify('TrustFactory', TrustFactory__factory, await trustFactory.getAddress())

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

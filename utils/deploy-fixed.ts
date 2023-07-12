// Note this script deploys the wallet contracts with bytecode as used on chain.
// This script does not run verification as source code may be different to the fixed static bytecode used here.

import { network, ethers as hethers } from 'hardhat'
import ora from 'ora'

import { BigNumber, ethers } from 'ethers'
import fs from 'fs'
import {
  MainModuleV2,
  FactoryV2,
  MainModuleUpgradeableV2,
  SequenceUtilsV2,
  GuestModuleV2,
  FactoryV1,
  MainModuleV1,
  MainModuleUpgradableV1,
  GuestModuleV1,
  SequenceUtilsV1,
  RequireFreshSignerV1
} from './contract-bytecodes'
import { UniversalDeployer } from '@0xsequence/deployer'

const provider = hethers.provider
const signer = provider.getSigner(0)

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

// v1
const universalDeployer = new UniversalDeployer(network.name, signer.provider)
const txParams = {
  gasLimit: 6000000,
  gasPrice: BigNumber.from(10).pow(9).mul(16)
}

const prompt = ora()

const buildNetworkJson = (...contracts: { name: string; address: string }[]) => {
  return contracts.map(c => ({
    contractName: c.name,
    address: c.address
  }))
}

type simpleContractFactory<Y extends Array<any>> = {
  getDeployTransaction: (...args: Y) => { data?: ethers.BytesLike }
  attach: (address: string) => ethers.Contract
}

const deploy = async <T extends simpleContractFactory<Y>, Y extends Array<any>>(
  name: string,
  contract: new (...args: [signer: ethers.Signer]) => T,
  ...args: Y
): Promise<ethers.Contract> => {
  const singletonFactory = new ethers.Contract(singletonFactoryFactory.address, singletonFactoryFactory.abi, signer)

  if (ethers.utils.arrayify(await provider.getCode(singletonFactory.address)).length <= 2) {
    const o = ora().start(`Deploying singleton factory`)
    // Deploy singleton deployer
    const deployerBal = BigNumber.from('24700000000000000')
    if ((await provider.getBalance(singletonFactoryDeployer)).lt(deployerBal)) {
      o.info('Funding singleton factory deployer')
      const tx = await signer.sendTransaction({
        to: singletonFactoryDeployer,
        value: deployerBal
      })
      await tx.wait()
      o.info('Funded. Deploying singleton factory')
    }
    const tx = await provider.sendTransaction(singletonFactoryDeployTx)
    await tx.wait()
    o.succeed(`Deployed singleton factory`)
  }

  const o = ora().start(`Deploying ${name}`)
  const c = new contract(signer)
  const { data } = c.getDeployTransaction(...args)

  if (!data) {
    throw new Error(`no data for ${name}`)
  }

  const maxGasLimit = await provider.getBlock('latest').then(b => b.gasLimit.mul(4).div(10))

  const address = ethers.utils.getAddress(
    ethers.utils.hexDataSlice(
      ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ['bytes1', 'address', 'bytes32', 'bytes32'],
          ['0xff', singletonFactory.address, ethers.constants.HashZero, ethers.utils.keccak256(data)]
        )
      ),
      12
    )
  )

  if (ethers.utils.arrayify(await provider.getCode(address)).length > 0) {
    o.succeed(`Skipping ${name} because it has been deployed at ${address}`)
    return c.attach(address)
  }

  await singletonFactory.deploy(data, ethers.constants.HashZero, { gasLimit: maxGasLimit }).then(tx => tx.wait())

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

  // v2

  const walletFactoryV2 = await deploy('Factory', FactoryV2)
  const mainModuleUpgradeableV2 = await deploy('MainModuleUpgradable', MainModuleUpgradeableV2)
  const mainModuleV2 = await deploy('MainModule', MainModuleV2, walletFactoryV2.address, mainModuleUpgradeableV2.address)
  const guestModuleV2 = await deploy('GuestModule', GuestModuleV2)
  const sequenceUtilsV2 = await deploy('SequenceUtils', SequenceUtilsV2)

  // v1

  const walletFactoryV1 = await universalDeployer.deploy('WalletFactory', FactoryV1, txParams)
  const mainModuleV1 = await universalDeployer.deploy('MainModule', MainModuleV1, txParams, 0, walletFactoryV1.address)
  const mainModuleUpgradeableV1 = await universalDeployer.deploy('MainModuleUpgradable', MainModuleUpgradableV1, txParams)
  const guestModuleV1 = await universalDeployer.deploy('GuestModule', GuestModuleV1, txParams)
  const sequenceUtilsV1 = await universalDeployer.deploy(
    'SequenceUtils',
    SequenceUtilsV1,
    txParams,
    0,
    walletFactoryV1.address,
    mainModuleV1.address
  )
  const requireFreshSignerLibV1 = await universalDeployer.deploy(
    'RequireFreshSignerLib',
    RequireFreshSignerV1,
    txParams,
    0,
    sequenceUtilsV1.address
  )

  // Guards

  if (walletFactoryV2.hasOwnProperty('deploy')) {
    prompt.start(`deploying guard v2`)
    if (ethers.utils.arrayify(await provider.getCode('0x761f5e29944D79d76656323F106CF2efBF5F09e9')).length > 0) {
      prompt.succeed(`Skipping guard v2 because it has been deployed`)
    } else {
      await walletFactoryV2.deploy(
        '0xfbf8f1a5e00034762d928f46d438b947f5d4065d',
        '0x6e2f52838722eda7d569b52db277d0d87d36991a6aa9b9657ef9d8f09b0c33f4'
      )
      prompt.succeed()
    }
    prompt.start(`deploying guard v1`)
    if (ethers.utils.arrayify(await provider.getCode('0x596aF90CecdBF9A768886E771178fd5561dD27Ab')).length > 0) {
      prompt.succeed(`Skipping guard v2 because it has been deployed`)
    } else {
      // Use v1 factory for this guard
      const walletFactoryV1 = walletFactoryV2.attach('0xf9D09D634Fb818b05149329C1dcCFAeA53639d96')
      await walletFactoryV1.deploy(
        '0xd01f11855bccb95f88d7a48492f66410d4637313',
        '0xc99c1ab359199e4dcbd4603e9b2956d5681241ceb286359cf6a647ca56e6e128'
      )
      prompt.succeed()
    }
  }

  prompt.start(`writing deployment information to ${network.name}.json`)
  fs.writeFileSync(
    `./networks/${network.name}.json`,
    JSON.stringify(
      buildNetworkJson(
        { name: 'WalletFactory', address: walletFactoryV2.address },
        { name: 'MainModule', address: mainModuleV2.address },
        { name: 'MainModuleUpgradable', address: mainModuleUpgradeableV2.address },
        { name: 'GuestModule', address: guestModuleV2.address },
        { name: 'SequenceUtils', address: sequenceUtilsV2.address }
      ),
      null,
      2
    )
  )
  fs.writeFileSync(
    `./networks/${network.name}_v1.json`,
    JSON.stringify(
      buildNetworkJson(
        { name: 'WalletFactory', address: walletFactoryV1.address },
        { name: 'MainModule', address: mainModuleV1.address },
        { name: 'MainModuleUpgradable', address: mainModuleUpgradeableV1.address },
        { name: 'GuestModule', address: guestModuleV1.address },
        { name: 'SequenceUtils', address: sequenceUtilsV1.address },
        { name: 'RequireFreshSignerLib', address: requireFreshSignerLibV1.address }
      ),
      null,
      2
    )
  )
  prompt.succeed()
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

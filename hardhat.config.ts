import { HardhatUserConfig, task } from 'hardhat/config'
import { networkConfig } from './utils/config-loader'

import '@nomiclabs/hardhat-truffle5'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-web3'
import '@nomiclabs/hardhat-etherscan'

import 'hardhat-gas-reporter'
import 'solidity-coverage'

import './utils/benchmarker'

import * as tdly from "@tenderly/hardhat-tenderly"

tdly.setup()

const ganacheNetwork = {
  url: 'http://127.0.0.1:8545',
  blockGasLimit: 6000000000
}

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: false,
        runs: 500000
      }
    }
  },
  networks: {
    mainnet: networkConfig('mainnet'),
    ropsten: networkConfig('ropsten'),
    rinkeby: networkConfig('rinkeby'),
    kovan: networkConfig('kovan'),
    goerli: networkConfig('goerli'),
    matic: networkConfig('matic'),
    mumbai: networkConfig('mumbai'),
    arbitrum: networkConfig('arbitrum'),
    arbitrumTestnet: networkConfig('arbitrum-testnet'),
    ganache: ganacheNetwork,
    coverage: {
      url: 'http://localhost:8555'
    },
    hardhat: {
      blockGasLimit: 60000000
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: networkConfig('mainnet').etherscan
  },
  mocha: {
    timeout: process.env.COVERAGE ? 15 * 60 * 1000 : 30 * 1000
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS === true,
    currency: 'USD',
    gasPrice: 21,
    showTimeSpent: true
  },
  tenderly: {
    project: "horizon/sequence-dev-1",
    username: "Agusx1211-horizon",
  }
}

export default config

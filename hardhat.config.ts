import { HardhatUserConfig, task } from 'hardhat/config'
import { networkConfig } from './utils/config-loader'

import '@nomiclabs/hardhat-truffle5'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-web3'
import '@nomiclabs/hardhat-etherscan'
import "@tenderly/hardhat-tenderly"

import 'hardhat-gas-reporter'
import 'solidity-coverage'

import './utils/benchmarker'

const ganacheNetwork = {
  url: 'http://127.0.0.1:8545',
  blockGasLimit: 6000000000
}

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: 500000,
      }
    }
  },
  networks: {
    mainnet: networkConfig('mainnet'),
    ropsten: networkConfig('ropsten'),
    kovan: networkConfig('kovan'),
    goerli: networkConfig('goerli'),
    polygon: networkConfig('polygon'),
    polygonZkevm: networkConfig('polygon-zkevm'),
    mumbai: networkConfig('mumbai'),
    arbitrum: networkConfig('arbitrum'),
    arbitrumGoerli: networkConfig('arbitrum-goerli'),
    arbitrumNova: networkConfig('arbitrum-nova'),
    optimism: networkConfig('optimism'),
    bnb: networkConfig('bnb'),
    bnbTestnet: networkConfig('bnb-testnet'),
    gnosis: networkConfig('gnosis'),
    avalanche: networkConfig('avalanche'),
    avalancheFuji: networkConfig('avalanche-fuji'),
    ganache: ganacheNetwork,
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

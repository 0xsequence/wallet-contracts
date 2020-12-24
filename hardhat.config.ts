import { HardhatUserConfig } from 'hardhat/config'
import { networkConfig } from './utils/configLoader'

import '@nomiclabs/hardhat-truffle5'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-web3'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

const ganacheNetwork = {
  url: 'http://127.0.0.1:8545',
  blockGasLimit: 6000000000
}

const config: HardhatUserConfig = {
  solidity: {
    version: '0.7.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000000,
        details: {
          yul: true
        }
      }
    }
  },
  paths: {
    tests: 'tests'
  },
  networks: {
    rinkeby: networkConfig('rinkeby'),
    kovan: networkConfig('kovan'),
    goerli: networkConfig('goerli'),
    matic: networkConfig('matic'),
    mumbai: networkConfig('mumbai'),
    ganache: ganacheNetwork,
    coverage: {
      url: 'http://localhost:8555'
    }
  },
  mocha: {
    timeout: process.env.COVERAGE ? 15 * 60 * 1000 : 30 * 1000
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS === true,
    currency: 'USD',
    gasPrice: 21,
    showTimeSpent: true
  }
}

export default config

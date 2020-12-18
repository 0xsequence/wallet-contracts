import { usePlugin } from "@nomiclabs/buidler/config";
import { networkConfig } from './src/utils/configLoader'

usePlugin("@nomiclabs/buidler-truffle5");
usePlugin("solidity-coverage");

const ganacheNetwork = {
  url: 'http://127.0.0.1:8545',
  blockGasLimit: 6000000000
}

module.exports = {
  solc: {
    version: "0.7.4",
    optimizer: {
      enabled: true,
      runs: 1000000
    },
  },
  paths:{
    tests: "src/tests"
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
  }
};

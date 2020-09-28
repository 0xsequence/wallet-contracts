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
    version: "0.6.8",
    optimizer: {
      enabled: true,
      runs: 1000000
    },
  },
  paths:{
    tests: "src"
  },
  networks: {
    rinkeby: networkConfig('rinkeby'),
    kovan: networkConfig('kovan'),
    goerli: networkConfig('goerli'),
    mumbai: networkConfig('mumbai'),
    ganache: ganacheNetwork
  }
};

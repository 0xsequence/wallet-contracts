import { usePlugin } from "@nomiclabs/buidler/config";

usePlugin("@nomiclabs/buidler-truffle5");

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
  }
};

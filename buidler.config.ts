import { usePlugin } from "@nomiclabs/buidler/config";

usePlugin("@nomiclabs/buidler-truffle5");

module.exports = {
  solc: {
    version: "0.6.4"
  },
  paths:{
    tests: "src"
  }
};

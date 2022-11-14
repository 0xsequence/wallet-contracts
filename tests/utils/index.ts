import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiString from 'chai-string'
import { ethers } from 'ethers'

import BN = require('bn.js') // used by web3

export * from './contract'
export * from './helpers'

const BigNumber = ethers.BigNumber
export { BigNumber }

export const { assert, expect } = chai
  .use(chaiString)
  .use(chaiAsPromised)
  .use(require('chai-bignumber')(BigNumber)) // Used by ethers.js & waffle
  .use(require('bn-chai')(BN))       // Used by Web3 & truffle

export function b(raw: ethers.BigNumberish): ethers.BigNumber {
  return ethers.BigNumber.from(raw)
}

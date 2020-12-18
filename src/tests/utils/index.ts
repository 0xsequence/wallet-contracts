import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiString from 'chai-string'
import * as ethers from 'ethers'

import * as web3 from 'web3'

export * from './contract'
export * from './helpers'

const BigNumber = ethers.utils.BigNumber
export { BigNumber }

export const { assert, expect } = chai
  .use(chaiString)
  .use(chaiAsPromised)
  .use(require('chai-bignumber')(BigNumber)) // Used by ethers.js & waffle
  .use(require('bn-chai')(web3.utils.BN))    // Used by Web3 & truffle

export function b(raw: ethers.utils.BigNumberish): ethers.utils.BigNumber {
  return ethers.utils.bigNumberify(raw)
}

import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiString from 'chai-string'
import * as ethers from 'ethers'
import { ethers as hethers } from 'hardhat'
import { solidity } from "ethereum-waffle"

import BN = require('bn.js') // used by web3

export * from './contract'
export * from './helpers'

export const { assert, expect } = chai
  .use(chaiString)
  .use(chaiAsPromised)
  .use(solidity)
  // .use(require('chai-shallow-deep-equal'))
  // .use(require('chai-bignumber')())

export function b(raw: ethers.BigNumberish): ethers.BigNumber {
  return ethers.BigNumber.from(raw)
}

export function randomHex(length: number): string {
  return ethers.utils.hexlify(ethers.utils.randomBytes(length))
}

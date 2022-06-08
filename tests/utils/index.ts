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

export async function expectToBeRejected(promise: Promise<any>, error: string) {
  if (!process.env.COVERAGE) {
    await expect(promise).to.be.rejectedWith(error)
  } else {
    await expect(promise).to.be.rejected
  }
}

export async function expectStaticToBeRejected(promise: Promise<any>, signature: string, ...args: any[]) {
  await expectToBeRejected(promise, `errorName="${signature.split("(")[0]}"`)
  await expectToBeRejected(promise, `errorSignature="${signature}"`)

  const sigTypes = signature.split("(")[1].split(")")[0].split(",")

  expect(sigTypes.length).to.equal(args.length)

  const formattedArgs = args.map((arg, i) => {
    const type = sigTypes[i]

    if (arg === "*") return '*'

    switch (type) {
      case "bytes":
        if (typeof arg === 'string' && arg.length === 0) return ethers.utils.hexlify([])
        return `"${ethers.utils.hexlify(arg).toLowerCase()}"`
      case "string":
        return `"${arg.toString()}"`
    }

    if (type.startsWith("uint") || type.startsWith("int")) {
      return `{"type":"BigNumber","hex":"${ethers.BigNumber.from(arg).toHexString()}"}`
    }

    throw new Error(`Unknown type: ${type}`)
  }).join(",")

  const groups = formattedArgs.split('*')
  if (groups.length === 1) {
    await expectToBeRejected(promise, `errorArgs=[${formattedArgs}]`)
  } else {
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      if (i === 0) {
        await expectToBeRejected(promise, `errorArgs=[${group}`)
      } else if (i === groups.length - 1) {
        await expectToBeRejected(promise, `${group}]`)
      } else {
        await expectToBeRejected(promise, `${group}`)
      }
    }
  }
}

export function encodeError(error: string): string {
  return "0x08c379a0" + ethers.utils.defaultAbiCoder.encode(['string'], [error]).slice(2)
}
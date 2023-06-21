import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiString from 'chai-string'
import * as ethers from 'ethers'
import { solidity } from 'ethereum-waffle'
import { ethers as hethers } from 'hardhat'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

export const CHAIN_ID = () => process.env.NET_ID ? ethers.BigNumber.from(process.env.NET_ID).toNumber() : hethers.provider.network.chainId

export const { assert, expect } = chai
  .use(chaiString)
  .use(chaiAsPromised)
  .use(solidity)

export function bytes32toAddress(bytes32: ethers.BytesLike): string {
  const paddedValue = ethers.utils.zeroPad(bytes32, 32)
  return ethers.utils.getAddress(ethers.utils.defaultAbiCoder.decode(['address'], paddedValue)[0])
}

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }

  return a
}

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

function xor(a: any, b: any) {
  if (!Buffer.isBuffer(a)) a = Buffer.from(ethers.utils.arrayify(a))
  if (!Buffer.isBuffer(b)) b = Buffer.from(ethers.utils.arrayify(b))
  return ethers.utils.hexlify(a.map((v: number, i: number) => v ^ b[i]))
}

export function interfaceIdOf(int: ethers.utils.Interface): string {
  const signatures = Object.keys(int.functions)
    .filter((k) => k.indexOf('(') !== -1)
    .map((k) => int.getSighash(int.functions[k]))

  return signatures.reduce((p, c) => xor(p, c))
}

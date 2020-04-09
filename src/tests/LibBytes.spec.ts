import * as ethers from 'ethers'
import { expect } from './utils';

import { LibBytesImpl } from 'typings/contracts/LibBytesImpl'

ethers.errors.setLogLevel('error')

const LibBytesImplArtifact = artifacts.require('LibBytesImpl');

const web3 = (global as any).web3

contract('LibBytes', (accounts: string[]) => {
  let libBytes

  before(async () => {
    libBytes = await LibBytesImplArtifact.new() as LibBytesImpl
  })

  describe('popLastByte', () => {
    it('Should pop last byte', async () => {
      const res = await libBytes.popLastByte('0x010203')
      expect(res[0]).to.equal('0x0102')
      expect(res[1]).to.equal('0x03')
    })
    it('Should pop single byte', async () => {
      const res = await libBytes.popLastByte('0x02')
      expect(res[0]).to.be.null
      expect(res[1]).to.equal('0x02')
    })
    it('Should fail to pop empty array', async () => {
      const tx = libBytes.popLastByte('0x')
      await expect(tx).to.be.rejectedWith('LibBytes#popLastByte: GREATER_THAN_ZERO_LENGTH_REQUIRED')
    })
  })

  describe('readUint8Uint16', () => {
    it('Should read uint8 and uint16 at index zero', async () => {
      const res = await libBytes.readUint8Uint16('0x03021e4453120a', 0)
      expect(res[0]).to.eq.BN(3)
      expect(res[1]).to.eq.BN(542)
      expect(res[2]).to.eq.BN(3)
    })
    it('Should read uint8 and uint16 at given index', async () => {
      const res = await libBytes.readUint8Uint16('0x5a9c2a6519d401d3', 3)
      expect(res[0]).to.eq.BN(101)
      expect(res[1]).to.eq.BN(6612)
      expect(res[2]).to.eq.BN(6)
    })
    it('Should read uint8 and uint16 at last index', async () => {
      const res = await libBytes.readUint8Uint16('0x02010004', 1)
      expect(res[0]).to.eq.BN(1)
      expect(res[1]).to.eq.BN(4)
      expect(res[2]).to.eq.BN(4)
    })
    it('Should fail read uint8 and uint16 out of bounds', async () => {
      const tx = libBytes.readUint8Uint16('0x5a9c', 0)
      await expect(tx).to.be.rejectedWith('LibBytes#readUint8Uint16: OUT_OF_BOUNDS')
    })
    it('Should fail read uint8 and uint16 fully out of bounds', async () => {
      const tx = libBytes.readUint8Uint16('0x5a9ca2', 12)
      await expect(tx).to.be.rejectedWith('LibBytes#readUint8Uint16: OUT_OF_BOUNDS')
    })
  })

  describe('readUint8Uint8', () => {
    it('Should read uint8 and uint8 at index zero', async () => {
      const res = await libBytes.readUint8Uint8('0x031e4453120a', 0)
      expect(res[0]).to.eq.BN(3)
      expect(res[1]).to.eq.BN(30)
      expect(res[2]).to.eq.BN(2)
    })
    it('Should read uint8 and uint8 at given index', async () => {
      const res = await libBytes.readUint8Uint8('0x5a9c2a6519d401d3', 3)
      expect(res[0]).to.eq.BN(101)
      expect(res[1]).to.eq.BN(25)
      expect(res[2]).to.eq.BN(5)
    })
    it('Should read uint8 and uint8 at last index', async () => {
      const res = await libBytes.readUint8Uint8('0x020114', 1)
      expect(res[0]).to.eq.BN(1)
      expect(res[1]).to.eq.BN(20)
      expect(res[2]).to.eq.BN(3)
    })
    it('Should fail read uint8 and uint8 out of bounds', async () => {
      const tx = libBytes.readUint8Uint8('0x5a', 0)
      await expect(tx).to.be.rejectedWith('LibBytes#readUint8Uint8: OUT_OF_BOUNDS')
    })
    it('Should fail read uint8 and uint16 fully out of bounds', async () => {
      const tx = libBytes.readUint8Uint8('0x5a9ca2', 12)
      await expect(tx).to.be.rejectedWith('LibBytes#readUint8Uint8: OUT_OF_BOUNDS')
    })
  })

  describe('readAddress', () => {
    let addr
    beforeEach(async () => {
      addr = web3.utils.toChecksumAddress(web3.utils.randomHex(20))
    })
    it('Should read address at index zero', async () => {
      const data = addr.concat(web3.utils.randomHex(9).slice(2))

      const res = await libBytes.readAddress(data, 0)
      expect(res[0]).to.equal(addr)
      expect(res[1]).to.eq.BN(20)
    })
    it('Should read address at given index', async () => {
      const data = web3.utils.randomHex(13)
        .concat(addr.slice(2))
        .concat(web3.utils.randomHex(6).slice(2))

      const res = await libBytes.readAddress(data, 13)
      expect(res[0]).to.equal(addr)
      expect(res[1]).to.eq.BN(33)
    })
    it('Should read address at last index', async () => {
      const data = web3.utils.randomHex(44).concat(addr.slice(2))

      const res = await libBytes.readAddress(data, 44)
      expect(res[0]).to.equal(addr)
      expect(res[1]).to.eq.BN(64)
    })
    it('Should fail read address out of bounds', async () => {
      const data = web3.utils.randomHex(44).concat(addr.slice(2))
      const tx = libBytes.readAddress(data, 45)
      await expect(tx).to.be.rejectedWith('LibBytes#readAddress: OUT_OF_BOUNDS')
    })
    it('Should fail read address totally out of bounds', async () => {
      const tx = libBytes.readAddress("0x010203", 345)
      await expect(tx).to.be.rejectedWith('LibBytes#readAddress: OUT_OF_BOUNDS')
    })
  })

  describe('readBytes66', () => {
    let bytes66
    beforeEach(async () => {
      bytes66 = web3.utils.randomHex(66)
    })
    it('Should read bytes66 at index zero', async () => {
      const data = bytes66.concat(web3.utils.randomHex(12).slice(2))

      const res = await libBytes.readBytes66(data, 0)
      expect(res[0]).to.equal(bytes66)
      expect(res[1]).to.eq.BN(66)
    })
    it('Should read bytes66 at given index', async () => {
      const data = web3.utils.randomHex(18)
        .concat(bytes66.slice(2))
        .concat(web3.utils.randomHex(62).slice(2))

      const res = await libBytes.readBytes66(data, 18)
      expect(res[0]).to.equal(bytes66)
      expect(res[1]).to.eq.BN(84)
    })
    it('Should read bytes66 at last index', async () => {
      const data = web3.utils.randomHex(33).concat(bytes66.slice(2))

      const res = await libBytes.readBytes66(data, 33)
      expect(res[0]).to.equal(bytes66)
      expect(res[1]).to.eq.BN(99)
    })
    it('Should fail read bytes66 out of bounds', async () => {
      const data = web3.utils.randomHex(33).concat(bytes66.slice(2))
      const tx = libBytes.readBytes66(data, 34)
      await expect(tx).to.be.rejectedWith('LibBytes#readBytes66: OUT_OF_BOUNDS')
    })
    it('Should fail read bytes66 totally out of bounds', async () => {
      const tx = libBytes.readBytes66("0x010203", 345)
      await expect(tx).to.be.rejectedWith('LibBytes#readBytes66: OUT_OF_BOUNDS')
    })
  })

  describe('readBytes32', () => {
    let bytes32;
    beforeEach(async () => {
      bytes32 = web3.utils.randomHex(32)
    })
    it('Should read bytes32 at index zero', async () => {
      const data = bytes32.concat(web3.utils.randomHex(16).slice(2))

      const res = await libBytes.readBytes32(data, 0)
      expect(res).to.equal(bytes32)
    })
    it('Should read bytes32 at given index', async () => {
      const data = web3.utils.randomHex(12)
        .concat(bytes32.slice(2))
        .concat(web3.utils.randomHex(44).slice(2))

      const res = await libBytes.readBytes32(data, 12)
      expect(res).to.equal(bytes32)
    })
    it('Should read bytes32 at last index', async () => {
      const data = web3.utils.randomHex(11).concat(bytes32.slice(2))

      const res = await libBytes.readBytes32(data, 11)
      expect(res).to.equal(bytes32)
    })
    it('Should fail read bytes32 out of bounds', async () => {
      const data = web3.utils.randomHex(11).concat(bytes32.slice(2))
      const tx = libBytes.readBytes32(data, 12)
      await expect(tx).to.be.rejectedWith('LibBytes#readBytes32: GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED')
    })
    it('Should fail read bytes32 totally out of bounds', async () => {
      const tx = libBytes.readBytes32("0x010203", 3145)
      await expect(tx).to.be.rejectedWith('LibBytes#readBytes32: GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED')
    })
  })

  describe('writeUint16', () => {
    it('Should write uint16 at index zero', async () => {
      const res = await libBytes.writeUint16("0x0000", 0, 42)
      expect(res[0]).to.be.equal("0x002a")
      expect(res[1]).to.eq.BN(2)
    })
    it('Should write uint16 at given index', async () => {
      const res = await libBytes.writeUint16("0x010200000000", 2, 8843)
      expect(res[0]).to.be.equal("0x0102228b0000")
      expect(res[1]).to.eq.BN(4)
    })
    it('Should write uint16 between bytes', async () => {
      const res = await libBytes.writeUint16("0x010200000304", 2, 8843)
      expect(res[0]).to.be.equal("0x0102228b0304")
      expect(res[1]).to.eq.BN(4)
    })
    it('Should write uint16 at last index', async () => {
      const res = await libBytes.writeUint16("0x110000", 1, 9999)
      expect(res[0]).to.be.equal("0x11270f")
      expect(res[1]).to.eq.BN(3)
    })
    it('Should overwrite uint16 between bytes', async () => {
      const res = await libBytes.writeUint16("0x010211110304", 2, 8843)
      expect(res[0]).to.be.equal("0x0102228b0304")
      expect(res[1]).to.eq.BN(4)
    })
    it('Should fail write uint16 out of bounds', async () => {
      const tx = libBytes.writeUint16("0x110000", 2, 9999)
      await expect(tx).to.be.rejectedWith('LibBytes#writeUint16: OUT_OF_BOUNDS')
    })
    it('Should fail write uint16 totally out of bounds', async () => {
      const tx = libBytes.writeUint16("0x110000", 22, 9999)
      await expect(tx).to.be.rejectedWith('LibBytes#writeUint16: OUT_OF_BOUNDS')
    })
  })

  describe('writeUint8Address', () => {
    let addr
    let uint8
    beforeEach(async () => {
      addr = web3.utils.randomHex(20)
      uint8 = web3.utils.randomHex(1)
    })
    it('Should write uint8 and address at index zero', async () => {
      const res = await libBytes.writeUint8Address(
        "0x" + "00".repeat(21) + "0000", 0, uint8, addr
      )

      const expected = uint8.concat(addr.slice(2)).concat("0000")

      expect(res[0]).to.be.equal(expected)
      expect(res[1]).to.eq.BN(21)
    })
    it('Should write uint8 and address at given index', async () => {
      const res = await libBytes.writeUint8Address(
        "0x0102" + "00".repeat(21) + "0000", 2, uint8, addr
      )

      const expected = "0x0102"
        .concat(uint8.slice(2))
        .concat(addr.slice(2))
        .concat("0000")

      expect(res[0]).to.be.equal(expected)
      expect(res[1]).to.eq.BN(23)
    })
    it('Should write uint8 and address between bytes', async () => {
      const res = await libBytes.writeUint8Address(
        "0x010203" + "00".repeat(21) + "9988", 3, uint8, addr
      )

      const expected = "0x010203"
        .concat(uint8.slice(2))
        .concat(addr.slice(2))
        .concat("9988")

      expect(res[0]).to.be.equal(expected)
      expect(res[1]).to.eq.BN(24)
    })
    it('Should write uint8 and address at last index', async () => {
      const res = await libBytes.writeUint8Address(
        "0xaa23abcd" + "00".repeat(21), 4, uint8, addr
      )

      const expected = "0xaa23abcd"
        .concat(uint8.slice(2))
        .concat(addr.slice(2))

      expect(res[0]).to.be.equal(expected)
      expect(res[1]).to.eq.BN(25)
    })
    it('Should overwrite uint8 and address between bytes', async () => {
      const res = await libBytes.writeUint8Address(
        "0x45a933" + web3.utils.randomHex(21).slice(2) + "0a4b", 3, uint8, addr
      )

      const expected = "0x45a933"
        .concat(uint8.slice(2))
        .concat(addr.slice(2))
        .concat("0a4b")

      expect(res[0]).to.be.equal(expected)
      expect(res[1]).to.eq.BN(24)
    })
    it('Should fail write uint8 and address out of bounds', async () => {
      const tx = libBytes.writeUint8Address("0xaa23abcd" + "00".repeat(21), 5, uint8, addr)
      await expect(tx).to.be.rejectedWith('LibBytes#writeUint8Address: OUT_OF_BOUNDS')
    })
    it('Should fail write uint8 and address totally out of bounds', async () => {
      const tx = libBytes.writeUint8Address("0xaa23abcd" + "00".repeat(21), 125, uint8, addr)
      await expect(tx).to.be.rejectedWith('LibBytes#writeUint8Address: OUT_OF_BOUNDS')
    })
  })
})

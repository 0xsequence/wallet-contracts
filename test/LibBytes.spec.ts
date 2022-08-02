import * as ethers from 'ethers'

import { expect, expectStaticToBeRejected, randomHex } from './utils'
import { ContractType, LibBytesImpl, LibBytesPointerImpl } from './utils/contracts'

contract('LibBytes', () => {
  let libBytes: ContractType<typeof LibBytesImpl>
  let libBytesPointer: ContractType<typeof LibBytesPointerImpl>


  before(async () => {
    libBytes = await LibBytesImpl.deploy()
    libBytesPointer = await LibBytesPointerImpl.deploy()
  })

  describe('readFirstUint16', () => {
    it('Should read first uint16', async () => {
      const res = await libBytesPointer.readFirstUint16('0x03021e4453120a')
      expect(res[0]).to.equal(770)
      expect(res[1]).to.equal(2)
    })

    it('Should read first uint16 of 2 byte array', async () => {
      const res = await libBytesPointer.readFirstUint16('0xff0a')
      expect(res[0]).to.equal(65290)
      expect(res[1]).to.equal(2)
    })

    it('Should read first uint16 out of bounds', async () => {
      const res = await libBytesPointer.readFirstUint16('0x')
      expect(res[0]).to.equal(0)
      expect(res[1]).to.equal(2)
    })
  })

  describe('readBytes32', () => {
    let bytes32: string
    beforeEach(async () => {
      bytes32 = randomHex(32)
    })
    it('Should read bytes32 at index zero', async () => {
      const data = bytes32.concat(randomHex(16).slice(2))

      const res = await libBytes.readBytes32(data, 0)
      expect(res).to.equal(bytes32)
    })
    it('Should read bytes32 at given index', async () => {
      const data = randomHex(12)
        .concat(bytes32.slice(2))
        .concat(randomHex(44).slice(2))

      const res = await libBytes.readBytes32(data, 12)
      expect(res).to.equal(bytes32)
    })
    it('Should read bytes32 at last index', async () => {
      const data = randomHex(11).concat(bytes32.slice(2))

      const res = await libBytes.readBytes32(data, 11)
      expect(res).to.equal(bytes32)
    })
    it('Should read bytes32 out of bounds', async () => {
      const data = randomHex(11).concat(bytes32.slice(2))
      const res = await libBytes.readBytes32(data, 12)
      expect(res).to.equal("0x" + data.slice(26, 26 + 64) + '00')
    })
    it('Should read bytes32 totally out of bounds', async () => {
      const res = await libBytes.readBytes32('0x010203', 3145)
      expect(res).to.equal(ethers.constants.HashZero)
    })
  })

  describe('readUint16', () => {
    it('Should read uint16 at index zero', async () => {
      const res = await libBytesPointer.readUint16('0x5202', 0)
      expect(res[0]).to.equal(20994)
      expect(res[1]).to.equal(2)
    })
    it('Should read uint16 at given index', async () => {
      const res = await libBytesPointer.readUint16('0x5a9c2a1019d401d3', 3)
      expect(res[0]).to.equal(4121)
      expect(res[1]).to.equal(5)
    })
    it('Should read uint16 at last index', async () => {
      const res = await libBytesPointer.readUint16('0x020414', 1)
      expect(res[0]).to.equal(1044)
      expect(res[1]).to.equal(3)
    })
    it('Should read zeros uint16 out of bounds', async () => {
      const res1 = await libBytesPointer.readUint16('0x5a', 0)
      const res2 = await libBytesPointer.readUint16('0x5a00', 0)
      expect(res1[0]).to.equal(23040)
      expect(res1[0]).to.equal(res2[0])
      expect(res1[1]).to.equal(2)
    })
    it('Should read zeros uint16 fully out of bounds', async () => {
      const res = await libBytesPointer.readUint16('0x5a9ca2', 12)
      expect(res[0]).to.equal(0)
      expect(res[1]).to.equal(14)
    })
  })

  describe('readUint64', () => {
    it('Should read uint64 at index zero', async () => {
      const res = await libBytesPointer.readUint64('0xc1725050681dcb2a', 0)
      expect(res[0]).to.equal(ethers.BigNumber.from("13939292102939495210"))
      expect(res[1]).to.equal(8)
    })
    it('Should read uint64 at given index', async () => {
      const res = await libBytesPointer.readUint64('0x0837acc1725050681dcb2a01cc', 3)
      expect(res[0]).to.equal(ethers.BigNumber.from("13939292102939495210"))
      expect(res[1]).to.equal(11)
    })
    it('Should read uint64 at last index', async () => {
      const res = await libBytesPointer.readUint64('0x0837acc1725050681dcb2a', 3)
      expect(res[0]).to.equal(ethers.BigNumber.from("13939292102939495210"))
      expect(res[1]).to.equal(11)
    })
    it('Should read zeros uint64 out of bounds', async () => {
      const res1 = await libBytesPointer.readUint64('0x5a', 0)
      const res2 = await libBytesPointer.readUint64('0x5a00', 0)
      const res3 = await libBytesPointer.readUint64('0x5a00000000000000', 0)
      expect(res1[0]).to.equal(ethers.BigNumber.from("6485183463413514240"))
      expect(res1[0]).to.equal(res2[0])
      expect(res1[0]).to.equal(res3[0])
      expect(res1[1]).to.equal(8)
    })
    it('Should read zeros uint64 fully out of bounds', async () => {
      const res = await libBytesPointer.readUint64('0x5a9ca2', 12)
      expect(res[0]).to.equal(0)
      expect(res[1]).to.equal(20)
    })
  })
})

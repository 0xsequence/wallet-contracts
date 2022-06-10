import { ethers as hethers } from 'hardhat'
import * as ethers from 'ethers'
import { expect, expectStaticToBeRejected, randomHex } from './utils'

import { LibBytesImpl, LibBytesImpl__factory } from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)


contract('LibBytes', () => {
  let libBytes: LibBytesImpl

  before(async () => {
    const factory = await hethers.getContractFactory('LibBytesImpl') as LibBytesImpl__factory
    libBytes = await factory.deploy()
  })

  describe('readFirstUint16', () => {
    it('Should read first uint16', async () => {
      const res = await libBytes.readFirstUint16('0x03021e4453120a')
      expect(res[0]).to.equal(770)
      expect(res[1]).to.equal(2)
    })
    it('Should read first uint16 of 2 byte array', async () => {
      const res = await libBytes.readFirstUint16('0xff0a')
      expect(res[0]).to.equal(65290)
      expect(res[1]).to.equal(2)
    })
    it('Should fail first uint16 out of bounds', async () => {
      const tx = libBytes.readFirstUint16('0x5a')
      await expectStaticToBeRejected(tx, `ReadFirstUint16OutOfBounds(bytes)`, `0x5a`)
    })
  })

  describe('readUint8Uint8', () => {
    it('Should read bool and uint8 at index zero', async () => {
      const res = await libBytes.readUint8Uint8('0x011e4453120a', 0)
      expect(res[0]).to.equal(1)
      expect(res[1]).to.equal(30)
      expect(res[2]).to.equal(2)
    })
    it('Should read bool and uint8 at given index', async () => {
      const res = await libBytes.readUint8Uint8('0x5a9c2a0019d401d3', 3)
      expect(res[0]).to.equal(0)
      expect(res[1]).to.equal(25)
      expect(res[2]).to.equal(5)
    })
    it('Should read bool and uint8 at last index', async () => {
      const res = await libBytes.readUint8Uint8('0x020414', 1)
      expect(res[0]).to.equal(4)
      expect(res[1]).to.equal(20)
      expect(res[2]).to.equal(3)
    })
    it('Should fail read bool and uint8 out of bounds', async () => {
      const tx = libBytes.readUint8Uint8('0x5a', 0)
      await expectStaticToBeRejected(tx, 'ReadUint8Uint8OutOfBounds(bytes,uint256)', '0x5a', 0)
    })
    it('Should fail read bool and uint16 fully out of bounds', async () => {
      const tx = libBytes.readUint8Uint8('0x5a9ca2', 12)
      await expectStaticToBeRejected(tx, 'ReadUint8Uint8OutOfBounds(bytes,uint256)', '0x5a9ca2', 12)
    })
  })

  describe('cReadUint8Uint8', () => {
    it('Should read uint8 and uint8 at index zero', async () => {
      const res = await libBytes.cReadUint8Uint8('0x011e4453120a', 0)
      expect(res[0]).to.equal(1)
      expect(res[1]).to.equal(30)
      expect(res[2]).to.equal(2)
    })
    it('Should read uint8 and uint8 at given index', async () => {
      const res = await libBytes.cReadUint8Uint8('0x5a9c2a0019d401d3', 3)
      expect(res[0]).to.equal(0)
      expect(res[1]).to.equal(25)
      expect(res[2]).to.equal(5)
    })
    it('Should read uint8 and uint8 at last index', async () => {
      const res = await libBytes.cReadUint8Uint8('0x020414', 1)
      expect(res[0]).to.equal(4)
      expect(res[1]).to.equal(20)
      expect(res[2]).to.equal(3)
    })
    it('Should read zeros if reading uint8 and uint8 out of bounds', async () => {
      const res = await libBytes.cReadUint8Uint8('0x5a', 0)
      expect(res[0]).to.equal(90)
      expect(res[1]).to.equal(0)
      expect(res[2]).to.equal(2)
    })
    it('Should read zeros if reading uint8 and uint16 fully out of bounds', async () => {
      const res = await libBytes.cReadUint8Uint8('0x5a9ca2', 12)
      expect(res[0]).to.equal(0)
      expect(res[1]).to.equal(0)
      expect(res[2]).to.equal(14)
    })
  })

  describe('readAddress', () => {
    let addr: string
    beforeEach(async () => {
      addr = ethers.utils.getAddress(randomHex(20))
    })
    it('Should read address at index zero', async () => {
      const data = addr.concat(randomHex(9).slice(2))

      const res = await libBytes.readAddress(data, 0)
      expect(res[0]).to.equal(addr)
      expect(res[1]).to.equal(20)
    })
    it('Should read address at given index', async () => {
      const data = randomHex(13)
        .concat(addr.slice(2))
        .concat(randomHex(6).slice(2))

      const res = await libBytes.readAddress(data, 13)
      expect(res[0]).to.equal(addr)
      expect(res[1]).to.equal(33)
    })
    it('Should read address at last index', async () => {
      const data = randomHex(44).concat(addr.slice(2))

      const res = await libBytes.readAddress(data, 44)
      expect(res[0]).to.equal(addr)
      expect(res[1]).to.equal(64)
    })
    it('Should fail read address out of bounds', async () => {
      const data = randomHex(44).concat(addr.slice(2))
      const tx = libBytes.readAddress(data, 45)
      await expectStaticToBeRejected(tx, "ReadAddressOutOfBounds(bytes,uint256)", data, 45)
    })
    it('Should fail read address totally out of bounds', async () => {
      const tx = libBytes.readAddress('0x010203', 345)
      await expectStaticToBeRejected(tx, "ReadAddressOutOfBounds(bytes,uint256)", '0x010203', 345)
    })
  })

  describe('cReadAddress', () => {
    let addr: string
    beforeEach(async () => {
      addr = ethers.utils.getAddress(randomHex(20))
    })
    it('Should read address at index zero', async () => {
      const data = addr.concat(randomHex(9).slice(2))

      const res = await libBytes.cReadAddress(data, 0)
      expect(res[0]).to.equal(addr)
      expect(res[1]).to.equal(20)
    })
    it('Should read address at given index', async () => {
      const data = randomHex(13)
        .concat(addr.slice(2))
        .concat(randomHex(6).slice(2))

      const res = await libBytes.cReadAddress(data, 13)
      expect(res[0]).to.equal(addr)
      expect(res[1]).to.equal(33)
    })
    it('Should read address at last index', async () => {
      const data = randomHex(44).concat(addr.slice(2))

      const res = await libBytes.cReadAddress(data, 44)
      expect(res[0]).to.equal(addr)
      expect(res[1]).to.equal(64)
    })
    it("Should read zeros if reading address out of bounds", async () => {
      const data = randomHex(44).concat(addr.slice(2))
      const res = await libBytes.cReadAddress(data, 45)
      expect(res[0]).to.equal(ethers.utils.getAddress("0x" + addr.slice(4).toLowerCase() + '00'))
      expect(res[1]).to.equal(45 + 20)
    })
    it('Should read zeros if reading address totally out of bounds', async () => {
      const res = await libBytes.cReadAddress('0x010203', 345)
      expect(res[0]).to.equal('0x0000000000000000000000000000000000000000')
      expect(res[1]).to.equal(345 + 20)
    })
  })

  describe('readBytes66', () => {
    let bytes66
    beforeEach(async () => {
      bytes66 = randomHex(66)
    })
    it('Should read bytes66 at index zero', async () => {
      const data = bytes66.concat(randomHex(12).slice(2))

      const res = await libBytes.readBytes66(data, 0)
      expect(res[0]).to.equal(bytes66)
      expect(res[1]).to.equal(66)
    })
    it('Should read bytes66 at given index', async () => {
      const data = randomHex(18)
        .concat(bytes66.slice(2))
        .concat(randomHex(62).slice(2))

      const res = await libBytes.readBytes66(data, 18)
      expect(res[0]).to.equal(bytes66)
      expect(res[1]).to.equal(84)
    })
    it('Should read bytes66 at last index', async () => {
      const data = randomHex(33).concat(bytes66.slice(2))

      const res = await libBytes.readBytes66(data, 33)
      expect(res[0]).to.equal(bytes66)
      expect(res[1]).to.equal(99)
    })
    it('Should fail read bytes66 out of bounds', async () => {
      const data = randomHex(33).concat(bytes66.slice(2))
      const tx = libBytes.readBytes66(data, 34)
      await expectStaticToBeRejected(tx, "ReadBytes66OutOfBounds(bytes,uint256)", data, 34)
    })
    it('Should fail read bytes66 totally out of bounds', async () => {
      const tx = libBytes.readBytes66('0x010203', 345)
      await expectStaticToBeRejected(tx, "ReadBytes66OutOfBounds(bytes,uint256)", '0x010203', 345)
    })
  })

  describe('readBytes32', () => {
    let bytes32
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
    it('Should fail read bytes32 out of bounds', async () => {
      const data = randomHex(11).concat(bytes32.slice(2))
      const tx = libBytes.readBytes32(data, 12)
      await expectStaticToBeRejected(tx, "ReadBytes32OutOfBounds(bytes,uint256)", data, 12)
    })
    it('Should fail read bytes32 totally out of bounds', async () => {
      const tx = libBytes.readBytes32('0x010203', 3145)
      await expectStaticToBeRejected(tx, "ReadBytes32OutOfBounds(bytes,uint256)", '0x010203', 3145)
    })
  })

  describe('readUint16', () => {
    it('Should read uint16 at index zero', async () => {
      const res = await libBytes.readUint16('0x5202', 0)
      expect(res[0]).to.equal(20994)
      expect(res[1]).to.equal(2)
    })
    it('Should read uint16 at given index', async () => {
      const res = await libBytes.readUint16('0x5a9c2a1019d401d3', 3)
      expect(res[0]).to.equal(4121)
      expect(res[1]).to.equal(5)
    })
    it('Should read uint16 at last index', async () => {
      const res = await libBytes.readUint16('0x020414', 1)
      expect(res[0]).to.equal(1044)
      expect(res[1]).to.equal(3)
    })
    it('Should fail read uint16 out of bounds', async () => {
      const tx = libBytes.readUint16('0x5a', 0)
      await expectStaticToBeRejected(tx, "ReadUint16OutOfBounds(bytes,uint256)", '0x5a', 0)
    })
    it('Should fail read uint16 fully out of bounds', async () => {
      const tx = libBytes.readUint16('0x5a9ca2', 12)
      await expectStaticToBeRejected(tx, "ReadUint16OutOfBounds(bytes,uint256)", '0x5a9ca2', 12)
    })
  })

  describe('cReadUint16', () => {
    it('Should read uint16 at index zero', async () => {
      const res = await libBytes.cReadUint16('0x5202', 0)
      expect(res[0]).to.equal(20994)
      expect(res[1]).to.equal(2)
    })
    it('Should read uint16 at given index', async () => {
      const res = await libBytes.cReadUint16('0x5a9c2a1019d401d3', 3)
      expect(res[0]).to.equal(4121)
      expect(res[1]).to.equal(5)
    })
    it('Should read uint16 at last index', async () => {
      const res = await libBytes.cReadUint16('0x020414', 1)
      expect(res[0]).to.equal(1044)
      expect(res[1]).to.equal(3)
    })
    it('Should read zeros uint16 out of bounds', async () => {
      const res1 = await libBytes.cReadUint16('0x5a', 0)
      const res2 = await libBytes.cReadUint16('0x5a00', 0)
      expect(res1[0]).to.equal(23040)
      expect(res1[0]).to.equal(res2[0])
      expect(res1[1]).to.equal(2)
    })
    it('Should read zeros uint16 fully out of bounds', async () => {
      const res = await libBytes.cReadUint16('0x5a9ca2', 12)
      expect(res[0]).to.equal(0)
      expect(res[1]).to.equal(14)
    })
  })

  describe('readBytes', () => {
    let size
    let bytes

    const modes = [{
      name: "Big bytes",
      size: () => ethers.BigNumber.from(randomHex(2)).toNumber()
    }, {
      name: "Max bytes",
      size: () => 65535
    }, {
      name: "Small bytes",
      size: () => ethers.BigNumber.from(randomHex(1)).toNumber()
    }].concat([...new Array(130)].map((_, i) => ({
      name: `${i} bytes`,
      size: () => i
    })))

    modes.forEach((mode) => {
      context(mode.name, () => {
        beforeEach(async () => {
          size = mode.size()
          bytes = randomHex(size)
        })
        it('Should read bytes at index zero', async () => {
          const data = bytes.concat(randomHex(16).slice(2))

          const res = await libBytes.readBytes(data, 0, size)
          expect(res[0]).to.equal(bytes)
          expect(res[1]).to.equal(size)
        })
        it('Should read bytes at given index', async () => {
          const data = randomHex(12)
            .concat(bytes.slice(2))
            .concat(randomHex(44).slice(2))

          const res = await libBytes.readBytes(data, 12, size)
          expect(res[0]).to.equal(bytes)
          expect(res[1]).to.equal(size + 12)
        })
        it('Should read bytes at last index', async () => {
          const data = randomHex(11).concat(bytes.slice(2))

          const res = await libBytes.readBytes(data, 11, size)
          expect(res[0]).to.equal(bytes)
          expect(res[1]).to.equal(size + 11)
        })
        it('Should fail read bytes out of bounds', async () => {
          const data = randomHex(11).concat(bytes.slice(2))
          const tx = libBytes.readBytes(data, 12, size)
          await expectStaticToBeRejected(tx, "ReadBytesOutOfBounds(bytes,uint256,uint256)", data, 12, size)
        })
        it('Should fail read bytes totally out of bounds', async () => {
          const tx = libBytes.readBytes('0x010203', 3145, size)
          await expectStaticToBeRejected(tx, "ReadBytesOutOfBounds(bytes,uint256,uint256)", '0x010203', 3145, size)
        })
      })
    })
  })
})

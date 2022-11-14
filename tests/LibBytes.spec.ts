import { ethers } from 'ethers'
import { expect } from './utils'

import { LibBytesImpl } from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const LibBytesImplArtifact = artifacts.require('LibBytesImpl')

import { web3 } from 'hardhat'

contract('LibBytes', (accounts: string[]) => {
  let libBytes

  before(async () => {
    libBytes = (await LibBytesImplArtifact.new()) as LibBytesImpl
  })

  describe('readFirstUint16', () => {
    it('Should read first uint16', async () => {
      const res = await libBytes.readFirstUint16('0x03021e4453120a')
      expect(res[0]).to.eq.BN(770)
      expect(res[1]).to.eq.BN(2)
    })
    it('Should read first uint16 of 2 byte array', async () => {
      const res = await libBytes.readFirstUint16('0xff0a')
      expect(res[0]).to.eq.BN(65290)
      expect(res[1]).to.eq.BN(2)
    })
    it('Should fail first uint16 out of bounds', async () => {
      const tx = libBytes.readFirstUint16('0x5a')
      await expect(tx).to.be.rejectedWith('LibBytes#readFirstUint16: OUT_OF_BOUNDS')
    })
  })

  describe('readUint8Uint8', () => {
    it('Should read bool and uint8 at index zero', async () => {
      const res = await libBytes.readUint8Uint8('0x011e4453120a', 0)
      expect(res[0]).to.eq.BN(1)
      expect(res[1]).to.eq.BN(30)
      expect(res[2]).to.eq.BN(2)
    })
    it('Should read bool and uint8 at given index', async () => {
      const res = await libBytes.readUint8Uint8('0x5a9c2a0019d401d3', 3)
      expect(res[0]).to.eq.BN(0)
      expect(res[1]).to.eq.BN(25)
      expect(res[2]).to.eq.BN(5)
    })
    it('Should read bool and uint8 at last index', async () => {
      const res = await libBytes.readUint8Uint8('0x020414', 1)
      expect(res[0]).to.eq.BN(4)
      expect(res[1]).to.eq.BN(20)
      expect(res[2]).to.eq.BN(3)
    })
    it('Should fail read bool and uint8 out of bounds', async () => {
      const tx = libBytes.readUint8Uint8('0x5a', 0)
      await expect(tx).to.be.rejectedWith('LibBytes#readUint8Uint8: OUT_OF_BOUNDS')
    })
    it('Should fail read bool and uint16 fully out of bounds', async () => {
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
      const data = web3.utils
        .randomHex(13)
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
      const tx = libBytes.readAddress('0x010203', 345)
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
      const data = web3.utils
        .randomHex(18)
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
      const tx = libBytes.readBytes66('0x010203', 345)
      await expect(tx).to.be.rejectedWith('LibBytes#readBytes66: OUT_OF_BOUNDS')
    })
  })

  describe('readBytes32', () => {
    let bytes32
    beforeEach(async () => {
      bytes32 = web3.utils.randomHex(32)
    })
    it('Should read bytes32 at index zero', async () => {
      const data = bytes32.concat(web3.utils.randomHex(16).slice(2))

      const res = await libBytes.readBytes32(data, 0)
      expect(res).to.equal(bytes32)
    })
    it('Should read bytes32 at given index', async () => {
      const data = web3.utils
        .randomHex(12)
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
      const tx = libBytes.readBytes32('0x010203', 3145)
      await expect(tx).to.be.rejectedWith('LibBytes#readBytes32: GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED')
    })
  })

  describe('readUint16', () => {
    it('Should read uint16 at index zero', async () => {
      const res = await libBytes.readUint16('0x5202', 0)
      expect(res[0]).to.eq.BN(20994)
      expect(res[1]).to.eq.BN(2)
    })
    it('Should read uint16 at given index', async () => {
      const res = await libBytes.readUint16('0x5a9c2a1019d401d3', 3)
      expect(res[0]).to.eq.BN(4121)
      expect(res[1]).to.eq.BN(5)
    })
    it('Should read uint16 at last index', async () => {
      const res = await libBytes.readUint16('0x020414', 1)
      expect(res[0]).to.eq.BN(1044)
      expect(res[1]).to.eq.BN(3)
    })
    it('Should fail read uint16 out of bounds', async () => {
      const tx = libBytes.readUint16('0x5a', 0)
      await expect(tx).to.be.rejectedWith('LibBytes#readUint16: OUT_OF_BOUNDS')
    })
    it('Should fail read uint16 fully out of bounds', async () => {
      const tx = libBytes.readUint16('0x5a9ca2', 12)
      await expect(tx).to.be.rejectedWith('LibBytes#readUint16: OUT_OF_BOUNDS')
    })
  })

  describe('readBytes', () => {
    let size
    let bytes

    const modes = [{
      name: "Big bytes",
      size: () => ethers.BigNumber.from(web3.utils.randomHex(2)).toNumber()
    }, {
      name: "Max bytes",
      size: () => 65535
    }, {
      name: "Small bytes",
      size: () => ethers.BigNumber.from(web3.utils.randomHex(1)).toNumber()
    }].concat([...new Array(130)].map((_, i) => ({
      name: `${i} bytes`,
      size: () => i
    })))

    modes.forEach((mode) => {
      context(mode.name, () => {
        beforeEach(async () => {
          size = mode.size()
          bytes = web3.utils.randomHex(size)
        })
        it('Should read bytes at index zero', async () => {
          const data = bytes.concat(web3.utils.randomHex(16).slice(2))

          const res = await libBytes.readBytes(data, 0, size)
          expect(res[0]).to.equal(size === 0 ? null : bytes)
          expect(res[1]).to.eq.BN(size)
        })
        it('Should read bytes at given index', async () => {
          const data = web3.utils
            .randomHex(12)
            .concat(bytes.slice(2))
            .concat(web3.utils.randomHex(44).slice(2))

          const res = await libBytes.readBytes(data, 12, size)
          expect(res[0]).to.equal(size === 0 ? null : bytes)
          expect(res[1]).to.eq.BN(size + 12)
        })
        it('Should read bytes at last index', async () => {
          const data = web3.utils.randomHex(11).concat(bytes.slice(2))

          const res = await libBytes.readBytes(data, 11, size)
          expect(res[0]).to.equal(size === 0 ? null : bytes)
          expect(res[1]).to.eq.BN(size + 11)
        })
        it('Should fail read bytes out of bounds', async () => {
          const data = web3.utils.randomHex(11).concat(bytes.slice(2))
          const tx = libBytes.readBytes(data, 12, size)
          await expect(tx).to.be.rejectedWith('LibBytes#readBytes: OUT_OF_BOUNDS')
        })
        it('Should fail read bytes totally out of bounds', async () => {
          const tx = libBytes.readBytes('0x010203', 3145, size)
          await expect(tx).to.be.rejectedWith('LibBytes#readBytes: OUT_OF_BOUNDS')
        })
      })
    })
  })
})

import * as ethers from 'ethers'

import { expect, expectStaticToBeRejected, randomHex } from './utils'
import { ContractType, LibStringImp } from './utils/contracts'

contract('LibString', () => {
  let libString: ContractType<typeof LibStringImp>

  before(async () => {
    libString = await LibStringImp.deploy()
  })

  describe('bytesToHexadecimal', () => {
    new Array(99).fill(0).map((_, i) => {
      it(`Should convert ${i} bytes to hexadecimal`, async () => {
        const bytes = randomHex(i)
        const expected = ethers.utils.hexlify(bytes)
        const result = await libString.bytesToHexadecimal(bytes)
        expect(result).to.eq(expected.slice(2))

        const prefixed = await libString.prefixHexadecimal(result)
        expect(prefixed).to.eq(expected)
      })
    })
  })

  describe('bytesToBase32', () => {
    ([
      ["0x", "b"],
      ["0x69", "bne"],
      ["0x8775", "bq52q"],
      ["0x91e0f3", "bshqpg"],
      ["0x4867e789", "bjbt6pci"],
      ["0x456fe65b8d", "bivx6mw4n"],
      ["0xb20b0f525320", "bwifq6ustea"],
      ["0xd292f6c85f4e5a", "b2kjpnsc7jzna"],
      ["0xf78beb02b622adc7", "b66f6wavwekw4o"],
      ["0xfad9c9851352f0ae0e", "b7lm4tbitklyk4dq"],
      ["0x30b4bca5f67cc95312be", "bgc2lzjpwptevgev6"],
      ["0xebc9fd66e4ae84644d502b", "b5pe72zxev2cgitkqfm"],
      ["0x0f198dc28836e24782e8d182", "bb4my3quig3repaxi2gba"],
      ["0x50059d23099f062187e9d52d8a", "bkacz2iyjt4dcdb7j2uwyu"],
      ["0x4c0e454dc43d303c896ef5f9c449", "bjqhektoehuydzclo6x44isi"],
      ["0x1ee41f4e940e4bf14df57a4fc06dd9", "bd3sb6tuubzf7ctpvpjh4a3oz"],
      ["0x04a8d211d53b45d29fed9a624bb2d5e0", "basuneeovhnc5fh7ntjrexmwv4a"],
      ["0x0a8b878364cdd555bda61db7c67503bb5e", "bbkfypa3ezxkvlpngdw34m5idxnpa"],
      ["0x313b3c6e446ee6eb6477c0b0b01b70799cb6", "bge5ty3sen3towzdxycylag3qpgolm"],
      ["0xe8be4a44970232babf052c3e75f611df8099c5", "b5c7eurexaizlvpyffq7hl5qr36ajtri"],
      ["0x461eb18d034475a35d4084a89e0e3a47980f3408", "biyplddidir22gxkaqsuj4dr2i6ma6nai"],
      ["0x519e139092a60229fe1a4db06d26fd199af9d39680", "bkgpbheesuybct7q2jwyg2jx5dgnptu4wqa"],
      ["0x0fdd1a5696148daf6986505e2b3dc9af16ed91452720", "bb7oruvuwcsg262mgkbpcwpojv4lo3ekfe4qa"],
      ["0x63a77d886c3f6593b6c6d37c7ab1f16ca3e34bd67e1ae1", "bmotx3cdmh5szhnwg2n6hvmprnsr6gs6wpynoc"],
      ["0x1198cc96b431176fc2d5bc8a8c49ce041e184649ec3b9cbb", "bcgmmzfvugelw7qwvxsfiysooaqpbqrsj5q5zzoy"],
      ["0x6b8d9af44a31c799ef835a522f8b630435c8e77e844360ad3d", "bnogzv5ckghdzt34dljjc7c3daq24rz36qrbwblj5"],
      ["0xbb2cb7057a24b8588bafd87907ee7579b159027dc7224a3f6540", "bxmwlobl2es4frc5p3b4qp3tvpgyvsat5y4reup3fia"],
      ["0x1f64b537d0e4b0158142dfa7cbfd9af76af0931862e48df02ba35b", "bd5slkn6q4syblakc36t4x7m265vpbeyymlsi34blunnq"],
      ["0x11c5655f9d5496039fe6b1a9651014d4a19e62331d61e73b48fec776", "bchcwkx45kslahh7gwguwkeau2sqz4yrtdvq6oo2i73dxm"],
      ["0x752c3c5cb4a3f06e4feff3f543278e97c7626569994b12b0d9ba9c7c83", "bouwdyxfuupyg4t7p6p2ugj4os7dwezljtffrfmgzxkohzay"],
      ["0xb6bd83f8bba80bc8aca3706f7090cd5a0f0cc6adf4e89614bff58c149880", "bw26yh6f3vaf4rlfdobxxbegnlihqzrvn6tujmff76wgbjgea"],
      ["0x90f4b198a1a1b2d3e01c36ba3460f46249f180dfa67b152f81552266a18708", "bsd2ldgfbugznhya4g25diyhumje7dag7uz5rkl4bkurgnimhba"],
      ["0x24cda83efac2802425b1c35a2d21b01576e71d0e512bcc80840f85f9e0af2faa", "betg2qpx2ykacijnrynnc2inqcv3oohiokev4zaeeb6c7tyfpf6va"],
      ["0x169dc221f4cec8756de592c3205a23177867f18c383d2251bd1a5c03cc346c3fe8", "bc2o4eipuz3ehk3pfslbsawrdc54gp4mmha6seun5djoahtbunq76q"],
      ["0x65b13b1aef3e44180314108b7f0434ddc23ad740a0df4df7984ad0bf1fdd84edcbaf", "bmwytwgxphzcbqayuccfx6bbu3xbdvv2audpu354yjlil6h65qtw4xly"]
    ]).map(([bytes, base32Encoded]) => {
      it(`Should convert ${ethers.utils.arrayify(bytes).length} bytes to base32`, async () => {
        const result = await libString.bytesToBase32(bytes)
        expect(result).to.equal(base32Encoded.slice(1))

        const prefixed = await libString.prefixBase32(result)
        expect(prefixed).to.equal(base32Encoded)
      })
    })
  })
})

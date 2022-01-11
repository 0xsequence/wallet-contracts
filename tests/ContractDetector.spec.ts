import { ethers } from 'hardhat'
import { ContractDetector, Factory, GuestModule, MainModule } from 'src/gen/typechain'
import { expect } from './utils'

const ContractDetectorArtifact = artifacts.require('ContractDetector')
const FactoryArtifact = artifacts.require('Factory')
const GuestModuleArtifact = artifacts.require('GuestModule')
const MainModuleArtifact = artifacts.require('MainModule')

contract('ContractDetector', () => {
  let contractDetector: ContractDetector
  let factory: Factory
  let guestModule: GuestModule
  let mainModule: MainModule

  before(async () => {
    contractDetector = await ContractDetectorArtifact.new()
    factory = await FactoryArtifact.new()
    guestModule = await GuestModuleArtifact.new()
    mainModule = await MainModuleArtifact.new(factory.address)
  })

  describe('Contract detection', () => {
    it('Should detect if addresses have contract code', async () => {
      const randomAddress = () => {
        return ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)))
      }

      const tests: Array<[string, boolean]> = [
        [randomAddress(), false],
        [contractDetector.address, true],
        [randomAddress(), false],
        [factory.address, true],
        [randomAddress(), false],
        [guestModule.address, true],
        [mainModule.address, true],
        [randomAddress(), false],
        ...(await ethers.getSigners()).map((signer): [string, boolean] => [signer.address, false])
      ]

      const results = await contractDetector.isContract(tests.map(([address, _]) => address))

      for (let i = 0; i < tests.length; i++) {
        if (tests[i][1]) {
          expect(results[i]).to.be.true
        } else {
          expect(results[i]).to.be.false
        }
      }
    })
  })
})

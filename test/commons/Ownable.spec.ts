
import * as ethers from 'ethers'

import { expect, expectToBeRejected } from '../utils'

import { ethers as hethers } from 'hardhat'
import { ContractType, Ownable } from '../utils/contracts'


contract('Ownable', () => {
  let ownable: ContractType<typeof Ownable>
  let owner: ethers.Signer

  beforeEach(async () => {
    owner = await hethers.provider.getSigner()
    ownable = await Ownable.deploy(await owner.getAddress())
  })

  it('Should set initial owner', async () => {
    expect(await ownable.owner()).to.equal(await owner.getAddress())
    expect(await ownable.isOwner(await owner.getAddress())).to.equal(true)
  })

  it('Should allow owner to transfer ownership', async () => {
    const newOwner = ethers.Wallet.createRandom().address
    await ownable.transferOwnership(newOwner)
    expect(await ownable.isOwner(newOwner)).to.equal(true)
    expect(await ownable.owner()).to.equal(newOwner)
  })

  it('Should fail to transfer ownership if not owner', async () => {
    const notOwner = await hethers.provider.getSigner(1)
    const newOwner = ethers.Wallet.createRandom().address
    const tx = ownable.connect(notOwner).transferOwnership(newOwner)
    await expectToBeRejected(tx, `NotOwner("${await notOwner.getAddress()}", "${await owner.getAddress()}")`)
  })

  it('Should fail to transfer ownership to address(0)', async () => {
    const newOwner = ethers.constants.AddressZero
    const tx = ownable.transferOwnership(newOwner)
    await expectToBeRejected(tx, `InvalidNewOwner`)
  })

  it('Should renounce ownership', async () => {
    await ownable.renounceOwnership()
    expect(await ownable.owner()).to.equal(ethers.constants.AddressZero)
    expect(await ownable.isOwner(await owner.getAddress())).to.equal(false)
    expect(await ownable.isOwner(ethers.constants.AddressZero)).to.equal(false)
  })

  it('Should fail to renounce ownership if not owner', async () => {
    const notOwner = await hethers.provider.getSigner(1)
    const tx = ownable.connect(notOwner).renounceOwnership()
    await expectToBeRejected(tx, `NotOwner("${await notOwner.getAddress()}", "${await owner.getAddress()}")`)
  })
})

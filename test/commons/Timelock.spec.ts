import * as ethers from 'ethers'

import { expect, expectToBeRejected } from '../utils'

import { ethers as hethers } from 'hardhat'
import { CallReceiverMock, ContractType, Timelock } from '../utils/contracts'


contract('Timelock', () => {
  let timelock: ContractType<typeof Timelock>

  const stubTx = {
    to: ethers.constants.AddressZero,
    value: 0,
    data: '0x',
    salt: 0
  }

  beforeEach(async () => {
    const owner = await hethers.provider.getSigner(0)
    timelock = await Timelock.deploy(await owner.getAddress())
  })

  it('Should set initial parameters', async () => {
    expect(await timelock.minDelay()).to.equal(30 * 24 * 60 * 60)
    expect(await timelock.maxDelay()).to.equal(365 * 24 * 60 * 60)
  })

  it('Should fail to set new delays if not self', async () => {
    const notOwner = await hethers.provider.getSigner(1)
    const tx = timelock.connect(notOwner).setDelays(1, 2)
    await expectToBeRejected(tx, `NotSelf("${await notOwner.getAddress()}")`)
  })

  it('Should schedule and execute transaction', async () => {
    const callReceiver = await CallReceiverMock.deploy()

    const tx = {
      to: callReceiver.address,
      value: 0,
      data: callReceiver.interface.encodeFunctionData('testCall', [42, []]),
      salt: 1
    }

    const delta = 31 * 24 * 60 * 60
    const eta = (await hethers.provider.getBlock('latest')).timestamp + delta
    await timelock.schedule(tx, eta)

    const hash = await timelock.hashTransaction(tx)

    const preExecute = timelock.execute(tx)
    await expectToBeRejected(preExecute, `TransactionNotReady("${hash}", ${eta})`)

    expect(await timelock.commits(hash)).to.equal(eta)

    await hethers.provider.send('evm_setNextBlockTimestamp', [eta + 10])
    await hethers.provider.send('evm_mine', [])

    await timelock.execute(tx)

    expect(await timelock.commits(hash)).to.equal(0)
    expect(await callReceiver.lastValA()).to.equal(42)

    const reExecute = timelock.execute(tx)
    await expectToBeRejected(reExecute, `TransactionNotScheduled("${hash}")`)
  })

  it('Should fail to schedule if not owner', async () => {
    const notOwner = await hethers.provider.getSigner(1)
    const tx = timelock.connect(notOwner).schedule(stubTx, 1)
    await expectToBeRejected(tx, `NotOwner("${await notOwner.getAddress()}", "${await timelock.owner()}")`)
  })

  it('Should fail to schedule in the past', async () => {
    const tx = timelock.schedule(stubTx, 1)
    await expectToBeRejected(tx, 'TimestampPassed(1)')
  })

  it('Should fail to schedule too far into the future', async () => {
    const tx = timelock.schedule(stubTx, 1e12)
    await expectToBeRejected(tx, 'AboveMaxDelay')
  })

  it('Should fail to execute if not owner', async () => {
    const notOwner = await hethers.provider.getSigner(1)
    const tx = timelock.connect(notOwner).execute(stubTx)
    await expectToBeRejected(tx, `NotOwner("${await notOwner.getAddress()}", "${await timelock.owner()}")`)
  })

  it('Should fail to execute after window end', async () => {
    const eta = (await hethers.provider.getBlock('latest')).timestamp + 31 * 24 * 60 * 60
    await timelock.schedule(stubTx, eta)
    await hethers.provider.send('evm_setNextBlockTimestamp', [eta * 2])
    await hethers.provider.send('evm_mine', [])
    const tx = timelock.execute(stubTx)
    await expectToBeRejected(tx, 'TransactionPastExecutionWindow')
  })

  it('Should fail to schedule below min delay', async () => {
    const eta = (await hethers.provider.getBlock('latest')).timestamp + 1
    const tx = timelock.schedule(stubTx, eta)
    await expectToBeRejected(tx, 'BelowMinDelay')
  })

  it('Should cancel transaction', async () => {
    const eta = (await hethers.provider.getBlock('latest')).timestamp + 31 * 24 * 60 * 60
    await timelock.schedule(stubTx, eta)
    const hash = await timelock.hashTransaction(stubTx)
    expect(await timelock.commits(hash)).to.equal(eta)
    await timelock.cancel(hash)
    expect(await timelock.commits(hash)).to.equal(0)
  })

  it('Should fail to cancel if not owner', async () => {
    const notOwner = await hethers.provider.getSigner(1)
    const tx = timelock.connect(notOwner).cancel(await timelock.hashTransaction(stubTx))
    await expectToBeRejected(tx, `NotOwner("${await notOwner.getAddress()}", "${await timelock.owner()}")`)
  })

  it('Should change delays', async () => {
    const minDelay = 1
    const maxDelay = 2

    const tx = {
      to: timelock.address,
      value: 0,
      data: timelock.interface.encodeFunctionData('setDelays', [minDelay, maxDelay]),
      salt: 2
    }

    const eta = (await hethers.provider.getBlock('latest')).timestamp + 31 * 24 * 60 * 60
    await timelock.schedule(tx, eta)
    await hethers.provider.send('evm_setNextBlockTimestamp', [eta + 10])
    await hethers.provider.send('evm_mine', [])

    await timelock.execute(tx)

    expect(await timelock.minDelay()).to.equal(minDelay)
    expect(await timelock.maxDelay()).to.equal(maxDelay)
  })
})

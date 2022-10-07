import * as ethers from "ethers"
import { ethers as hethers } from "hardhat"
import * as t from "../../gen/typechain"

const cachedFactories: { [name: string]: ethers.ContractFactory } = {}

async function deploy<Y extends ethers.Contract>(name: string, ...args: any[]) {
  const factory = await hethers.getContractFactory(name)
  cachedFactories[name] = factory
  return await factory.deploy(...args) as Y
}

function attach<Y extends ethers.Contract>(name: string, address: string) {
  return cachedFactories[name].attach(address) as Y
}

type Adapter<T extends ethers.Contract> = {
  cache: () => Promise<any>
  deploy: (...args: any[]) => Promise<T>
  attach: (address: string) => T
  factory: () => ethers.ContractFactory
}

function adapt<T extends ethers.Contract>(name: string): Adapter<T> {
  return {
    cache: async () => cachedFactories[name] = await hethers.getContractFactory(name),
    deploy: (...args: any[]) => deploy<T>(name, ...args),
    attach: (address: string) => attach<T>(name, address),
    factory: () => cachedFactories[name],
  }
}

export type ContractType<T extends Adapter<any>> = T extends Adapter<infer U> ? U : never

export const LibBytesImpl = adapt<t.LibBytesImpl>("LibBytesImpl")
export const LibBytesPointerImpl = adapt<t.LibBytesPointerImpl>("LibBytesPointerImpl")
export const Factory = adapt<t.Factory>("Factory")
export const MainModule = adapt<t.MainModule>("MainModule")
export const MainModuleUpgradable = adapt<t.MainModuleUpgradable>("MainModuleUpgradable")
export const ERC165CheckerMock = adapt<t.ERC165CheckerMock>("ERC165CheckerMock")
export const ModuleMock = adapt<t.ModuleMock>("ModuleMock")
export const CallReceiverMock = adapt<t.CallReceiverMock>("CallReceiverMock")
export const MultiCallUtils = adapt<t.MultiCallUtils>("MultiCallUtils")
export const GuestModule = adapt<t.GuestModule>("GuestModule")
export const HookMock = adapt<t.HookMock>("HookMock")
export const HookCallerMock = adapt<t.HookCallerMock>("HookCallerMock")
export const RequireUtils = adapt<t.RequireUtils>("RequireUtils")
export const DelegateCallMock = adapt<t.DelegateCallMock>("DelegateCallMock")
export const GasBurnerMock = adapt<t.GasBurnerMock>("GasBurnerMock")
export const GasEstimator = adapt<t.GasEstimator>("GasEstimator")
export const MainModuleGasEstimation = adapt<t.MainModuleGasEstimation>("MainModuleGasEstimation")
export const Ownable = adapt<t.Ownable>("Ownable")
export const Timelock = adapt<t.Timelock>("Timelock")
export const MainModuleAutoUpdate = adapt<t.MainModuleAutoUpdate>("MainModuleAutoUpdate")
export const ModuleRepository = adapt<t.ModuleRepository>("ModuleRepository")

;[
  LibBytesImpl,
  Factory,
  MainModule,
  MainModuleUpgradable,
  ERC165CheckerMock,
  ModuleMock,
  CallReceiverMock,
  MultiCallUtils,
  GuestModule,
  HookMock,
  HookCallerMock,
  RequireUtils,
  DelegateCallMock,
  GasEstimator
].map((c) => c.cache())

export const deploySequenceContext = async () => {
  const factory = await Factory.deploy()
  const mainModuleUpgradable = await MainModuleUpgradable.deploy()
  const mainModule = await MainModule.deploy(
    factory.address,
    mainModuleUpgradable.address,
    ethers.constants.AddressZero
  )

  return { factory, mainModule, mainModuleUpgradable }
}

export const deploySequenceAutoUpdate = async (context: SequenceContext ) => {
  const owner = hethers.provider.getSigner(0)
  const repository = await ModuleRepository.deploy(await owner.getAddress())

  const keyMainModule = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("sequence.mainModule"))
  const keyMainModuleUpgradable = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("sequence.mainModuleUpgradable"))

  const mainModuleAuto = await MainModuleAutoUpdate.deploy(keyMainModule, repository.address)
  const mainModuleUpgradableAuto = await MainModuleAutoUpdate.deploy(keyMainModuleUpgradable, repository.address)

  const mainModuleForAutoUpdate = await MainModule.deploy(
    context.factory.address,
    mainModuleUpgradableAuto.address,
    mainModuleAuto.address
  )

  await repository.setModule(keyMainModule, mainModuleForAutoUpdate.address)
  await repository.setModule(keyMainModuleUpgradable, context.mainModuleUpgradable.address)

  return {
    ...context,
    repository,
    moduleKeys: {
      keyMainModule,
      keyMainModuleUpgradable
    },
    mainModule: MainModule.attach(mainModuleAuto.address),
    mainModuleUpgradable: MainModuleUpgradable.attach(mainModuleUpgradableAuto.address)
  }
}

export type SequenceContext = {
  factory: ContractType<typeof Factory>,
  mainModule: ContractType<typeof MainModule>,
  mainModuleUpgradable: ContractType<typeof MainModuleUpgradable>
}

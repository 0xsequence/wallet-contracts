/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { ModuleMock } from "../ModuleMock";

export class ModuleMock__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ModuleMock> {
    return super.deploy(overrides || {}) as Promise<ModuleMock>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ModuleMock {
    return super.attach(address) as ModuleMock;
  }
  connect(signer: Signer): ModuleMock__factory {
    return super.connect(signer) as ModuleMock__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ModuleMock {
    return new Contract(address, _abi, signerOrProvider) as ModuleMock;
  }
}

const _abi = [
  {
    anonymous: false,
    inputs: [],
    name: "Pong",
    type: "event",
  },
  {
    inputs: [],
    name: "ping",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x6080604052348015600f57600080fd5b5060968061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80635c36b18614602d575b600080fd5b60336035565b005b6040517f4d015fcc2a20c24d7be893b3a525eac864b5a53a5f88ef7201a600465c73314e90600090a156fea26469706673582212201d4403fc62713fef9a01884050dcb3a8fdc4556f1617d27e2024feff5616936364736f6c63430007060033";

/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { NonceResetUtils } from "../NonceResetUtils";

export class NonceResetUtils__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<NonceResetUtils> {
    return super.deploy(overrides || {}) as Promise<NonceResetUtils>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): NonceResetUtils {
    return super.attach(address) as NonceResetUtils;
  }
  connect(signer: Signer): NonceResetUtils__factory {
    return super.connect(signer) as NonceResetUtils__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): NonceResetUtils {
    return new Contract(address, _abi, signerOrProvider) as NonceResetUtils;
  }
}

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_space",
        type: "uint256",
      },
    ],
    name: "ResetNonce",
    type: "event",
  },
];

const _bytecode =
  "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220c08573bee381e8ddce2d756ad01e06a4c87f0049b4d24ab0fc7acf30099ad5bb64736f6c63430007060033";

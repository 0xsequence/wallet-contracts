/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { IModuleAuthUpgradable } from "../IModuleAuthUpgradable";

export class IModuleAuthUpgradable__factory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IModuleAuthUpgradable {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as IModuleAuthUpgradable;
  }
}

const _abi = [
  {
    inputs: [],
    name: "imageHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_imageHash",
        type: "bytes32",
      },
    ],
    name: "updateImageHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  SubModuleAuthLegacy,
  SubModuleAuthLegacyInterface,
} from "../SubModuleAuthLegacy";

const _abi = [
  {
    inputs: [],
    name: "ImageHashIsZero",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_hash",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "_addr",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes",
      },
    ],
    name: "InvalidNestedSignature",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes",
      },
      {
        internalType: "bytes32",
        name: "_s",
        type: "bytes32",
      },
    ],
    name: "InvalidSValue",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_flag",
        type: "uint256",
      },
    ],
    name: "InvalidSignatureFlag",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes",
      },
    ],
    name: "InvalidSignatureLength",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_type",
        type: "uint256",
      },
    ],
    name: "InvalidSignatureType",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "_v",
        type: "uint256",
      },
    ],
    name: "InvalidVValue",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes",
      },
    ],
    name: "SignerIsAddress0",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "_type",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_recoverMode",
        type: "bool",
      },
    ],
    name: "UnsupportedSignatureType",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "newImageHash",
        type: "bytes32",
      },
    ],
    name: "ImageHashUpdated",
    type: "event",
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

export class SubModuleAuthLegacy__factory {
  static readonly abi = _abi;
  static createInterface(): SubModuleAuthLegacyInterface {
    return new utils.Interface(_abi) as SubModuleAuthLegacyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SubModuleAuthLegacy {
    return new Contract(address, _abi, signerOrProvider) as SubModuleAuthLegacy;
  }
}

/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
} from "ethers";
import {
  Contract,
  ContractTransaction,
  PayableOverrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface ModuleCreatorInterface extends ethers.utils.Interface {
  functions: {
    "createContract(bytes)": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "createContract",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "createContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;

  events: {
    "CreatedContract(address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "CreatedContract"): EventFragment;
}

export class ModuleCreator extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: ModuleCreatorInterface;

  functions: {
    createContract(
      _code: BytesLike,
      overrides?: PayableOverrides
    ): Promise<ContractTransaction>;

    "createContract(bytes)"(
      _code: BytesLike,
      overrides?: PayableOverrides
    ): Promise<ContractTransaction>;

    supportsInterface(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    "supportsInterface(bytes4)"(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;
  };

  createContract(
    _code: BytesLike,
    overrides?: PayableOverrides
  ): Promise<ContractTransaction>;

  "createContract(bytes)"(
    _code: BytesLike,
    overrides?: PayableOverrides
  ): Promise<ContractTransaction>;

  supportsInterface(
    _interfaceID: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "supportsInterface(bytes4)"(
    _interfaceID: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  callStatic: {
    createContract(
      _code: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    "createContract(bytes)"(
      _code: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    supportsInterface(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "supportsInterface(bytes4)"(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;
  };

  filters: {
    CreatedContract(_contract: null): EventFilter;
  };

  estimateGas: {
    createContract(
      _code: BytesLike,
      overrides?: PayableOverrides
    ): Promise<BigNumber>;

    "createContract(bytes)"(
      _code: BytesLike,
      overrides?: PayableOverrides
    ): Promise<BigNumber>;

    supportsInterface(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "supportsInterface(bytes4)"(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    createContract(
      _code: BytesLike,
      overrides?: PayableOverrides
    ): Promise<PopulatedTransaction>;

    "createContract(bytes)"(
      _code: BytesLike,
      overrides?: PayableOverrides
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "supportsInterface(bytes4)"(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
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
  Overrides,
  PayableOverrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface GuestModuleInterface extends ethers.utils.Interface {
  functions: {
    "createContract(bytes)": FunctionFragment;
    "execute(tuple[],uint256,bytes)": FunctionFragment;
    "isValidSignature(bytes32,bytes)": FunctionFragment;
    "nonce()": FunctionFragment;
    "readNonce(uint256)": FunctionFragment;
    "selfExecute(tuple[])": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "createContract",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "execute",
    values: [
      {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      BigNumberish,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "isValidSignature",
    values: [BytesLike, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "nonce", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "readNonce",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "selfExecute",
    values: [
      {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "createContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "execute", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isValidSignature",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "nonce", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "readNonce", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "selfExecute",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;

  events: {
    "CreatedContract(address)": EventFragment;
    "NonceChange(uint256,uint256)": EventFragment;
    "TxExecuted(bytes32)": EventFragment;
    "TxFailed(bytes32,bytes)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "CreatedContract"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "NonceChange"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TxExecuted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TxFailed"): EventFragment;
}

export class GuestModule extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: GuestModuleInterface;

  functions: {
    createContract(
      _code: BytesLike,
      overrides?: PayableOverrides
    ): Promise<ContractTransaction>;

    "createContract(bytes)"(
      _code: BytesLike,
      overrides?: PayableOverrides
    ): Promise<ContractTransaction>;

    execute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "execute(tuple[],uint256,bytes)"(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "isValidSignature(bytes32,bytes)"(
      _hash: BytesLike,
      _signatures: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    "isValidSignature(bytes,bytes)"(
      _data: BytesLike,
      _signatures: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    nonce(overrides?: CallOverrides): Promise<[BigNumber]>;

    "nonce()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    readNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "readNonce(uint256)"(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    selfExecute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "selfExecute(tuple[])"(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      overrides?: Overrides
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

  execute(
    _txs: {
      delegateCall: boolean;
      revertOnError: boolean;
      gasLimit: BigNumberish;
      target: string;
      value: BigNumberish;
      data: BytesLike;
    }[],
    arg1: BigNumberish,
    arg2: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "execute(tuple[],uint256,bytes)"(
    _txs: {
      delegateCall: boolean;
      revertOnError: boolean;
      gasLimit: BigNumberish;
      target: string;
      value: BigNumberish;
      data: BytesLike;
    }[],
    arg1: BigNumberish,
    arg2: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "isValidSignature(bytes32,bytes)"(
    _hash: BytesLike,
    _signatures: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  "isValidSignature(bytes,bytes)"(
    _data: BytesLike,
    _signatures: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  nonce(overrides?: CallOverrides): Promise<BigNumber>;

  "nonce()"(overrides?: CallOverrides): Promise<BigNumber>;

  readNonce(
    _space: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "readNonce(uint256)"(
    _space: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  selfExecute(
    _txs: {
      delegateCall: boolean;
      revertOnError: boolean;
      gasLimit: BigNumberish;
      target: string;
      value: BigNumberish;
      data: BytesLike;
    }[],
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "selfExecute(tuple[])"(
    _txs: {
      delegateCall: boolean;
      revertOnError: boolean;
      gasLimit: BigNumberish;
      target: string;
      value: BigNumberish;
      data: BytesLike;
    }[],
    overrides?: Overrides
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

    execute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "execute(tuple[],uint256,bytes)"(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "isValidSignature(bytes32,bytes)"(
      _hash: BytesLike,
      _signatures: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    "isValidSignature(bytes,bytes)"(
      _data: BytesLike,
      _signatures: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    nonce(overrides?: CallOverrides): Promise<BigNumber>;

    "nonce()"(overrides?: CallOverrides): Promise<BigNumber>;

    readNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "readNonce(uint256)"(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    selfExecute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      overrides?: CallOverrides
    ): Promise<void>;

    "selfExecute(tuple[])"(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      overrides?: CallOverrides
    ): Promise<void>;

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

    NonceChange(_space: null, _newNonce: null): EventFilter;

    TxExecuted(_tx: null): EventFilter;

    TxFailed(_tx: null, _reason: null): EventFilter;
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

    execute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "execute(tuple[],uint256,bytes)"(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "isValidSignature(bytes32,bytes)"(
      _hash: BytesLike,
      _signatures: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "isValidSignature(bytes,bytes)"(
      _data: BytesLike,
      _signatures: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    nonce(overrides?: CallOverrides): Promise<BigNumber>;

    "nonce()"(overrides?: CallOverrides): Promise<BigNumber>;

    readNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "readNonce(uint256)"(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    selfExecute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      overrides?: Overrides
    ): Promise<BigNumber>;

    "selfExecute(tuple[])"(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      overrides?: Overrides
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

    execute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "execute(tuple[],uint256,bytes)"(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "isValidSignature(bytes32,bytes)"(
      _hash: BytesLike,
      _signatures: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "isValidSignature(bytes,bytes)"(
      _data: BytesLike,
      _signatures: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    nonce(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "nonce()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    readNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "readNonce(uint256)"(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    selfExecute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "selfExecute(tuple[])"(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      overrides?: Overrides
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
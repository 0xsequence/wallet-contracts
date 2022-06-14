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
  BaseContract,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface MainModuleInterface extends ethers.utils.Interface {
  functions: {
    "FACTORY()": FunctionFragment;
    "INIT_CODE_HASH()": FunctionFragment;
    "UPGRADEABLE_IMPLEMENTATION()": FunctionFragment;
    "addHook(bytes4,address)": FunctionFragment;
    "createContract(bytes)": FunctionFragment;
    "execute((bool,bool,uint256,address,uint256,bytes)[],uint256,bytes)": FunctionFragment;
    "isValidSignature(bytes32,bytes)": FunctionFragment;
    "nonce()": FunctionFragment;
    "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)": FunctionFragment;
    "onERC1155Received(address,address,uint256,uint256,bytes)": FunctionFragment;
    "onERC721Received(address,address,uint256,bytes)": FunctionFragment;
    "readGapNonce(uint256)": FunctionFragment;
    "readHook(bytes4)": FunctionFragment;
    "readNonce(uint256)": FunctionFragment;
    "removeHook(bytes4)": FunctionFragment;
    "selfExecute((bool,bool,uint256,address,uint256,bytes)[])": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
    "updateImageHash(bytes32)": FunctionFragment;
    "updateImplementation(address)": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "FACTORY", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "INIT_CODE_HASH",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "UPGRADEABLE_IMPLEMENTATION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "addHook",
    values: [BytesLike, string]
  ): string;
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
    functionFragment: "onERC1155BatchReceived",
    values: [string, string, BigNumberish[], BigNumberish[], BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "onERC1155Received",
    values: [string, string, BigNumberish, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "onERC721Received",
    values: [string, string, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "readGapNonce",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "readHook", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "readNonce",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "removeHook",
    values: [BytesLike]
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
  encodeFunctionData(
    functionFragment: "updateImageHash",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "updateImplementation",
    values: [string]
  ): string;

  decodeFunctionResult(functionFragment: "FACTORY", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "INIT_CODE_HASH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "UPGRADEABLE_IMPLEMENTATION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "addHook", data: BytesLike): Result;
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
  decodeFunctionResult(
    functionFragment: "onERC1155BatchReceived",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "onERC1155Received",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "onERC721Received",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "readGapNonce",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "readHook", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "readNonce", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "removeHook", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "selfExecute",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateImageHash",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateImplementation",
    data: BytesLike
  ): Result;

  events: {
    "CreatedContract(address)": EventFragment;
    "GapNonceChange(uint256,uint256,uint256)": EventFragment;
    "ImageHashUpdated(bytes32)": EventFragment;
    "ImplementationUpdated(address)": EventFragment;
    "NoNonceUsed()": EventFragment;
    "NonceChange(uint256,uint256)": EventFragment;
    "TxExecuted(bytes32)": EventFragment;
    "TxFailed(bytes32,bytes)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "CreatedContract"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "GapNonceChange"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ImageHashUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ImplementationUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "NoNonceUsed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "NonceChange"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TxExecuted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TxFailed"): EventFragment;
}

export type CreatedContractEvent = TypedEvent<[string] & { _contract: string }>;

export type GapNonceChangeEvent = TypedEvent<
  [BigNumber, BigNumber, BigNumber] & {
    _space: BigNumber;
    _oldNonce: BigNumber;
    _newNonce: BigNumber;
  }
>;

export type ImageHashUpdatedEvent = TypedEvent<
  [string] & { newImageHash: string }
>;

export type ImplementationUpdatedEvent = TypedEvent<
  [string] & { newImplementation: string }
>;

export type NoNonceUsedEvent = TypedEvent<[] & {}>;

export type NonceChangeEvent = TypedEvent<
  [BigNumber, BigNumber] & { _space: BigNumber; _newNonce: BigNumber }
>;

export type TxExecutedEvent = TypedEvent<[string] & { _tx: string }>;

export type TxFailedEvent = TypedEvent<
  [string, string] & { _tx: string; _reason: string }
>;

export class MainModule extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: MainModuleInterface;

  functions: {
    FACTORY(overrides?: CallOverrides): Promise<[string]>;

    INIT_CODE_HASH(overrides?: CallOverrides): Promise<[string]>;

    UPGRADEABLE_IMPLEMENTATION(overrides?: CallOverrides): Promise<[string]>;

    addHook(
      _signature: BytesLike,
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    createContract(
      _code: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
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
      _nonce: BigNumberish,
      _signature: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
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

    onERC1155BatchReceived(
      arg0: string,
      arg1: string,
      arg2: BigNumberish[],
      arg3: BigNumberish[],
      arg4: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    onERC1155Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BigNumberish,
      arg4: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    onERC721Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    readGapNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    readHook(
      _signature: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    readNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    removeHook(
      _signature: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    selfExecute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: BytesLike;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    supportsInterface(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    updateImageHash(
      _imageHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    updateImplementation(
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  FACTORY(overrides?: CallOverrides): Promise<string>;

  INIT_CODE_HASH(overrides?: CallOverrides): Promise<string>;

  UPGRADEABLE_IMPLEMENTATION(overrides?: CallOverrides): Promise<string>;

  addHook(
    _signature: BytesLike,
    _implementation: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  createContract(
    _code: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
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
    _nonce: BigNumberish,
    _signature: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
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

  onERC1155BatchReceived(
    arg0: string,
    arg1: string,
    arg2: BigNumberish[],
    arg3: BigNumberish[],
    arg4: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  onERC1155Received(
    arg0: string,
    arg1: string,
    arg2: BigNumberish,
    arg3: BigNumberish,
    arg4: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  onERC721Received(
    arg0: string,
    arg1: string,
    arg2: BigNumberish,
    arg3: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  readGapNonce(
    _space: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  readHook(_signature: BytesLike, overrides?: CallOverrides): Promise<string>;

  readNonce(
    _space: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  removeHook(
    _signature: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  selfExecute(
    _txs: {
      delegateCall: boolean;
      revertOnError: boolean;
      gasLimit: BigNumberish;
      target: string;
      value: BigNumberish;
      data: BytesLike;
    }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  supportsInterface(
    _interfaceID: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  updateImageHash(
    _imageHash: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  updateImplementation(
    _implementation: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    FACTORY(overrides?: CallOverrides): Promise<string>;

    INIT_CODE_HASH(overrides?: CallOverrides): Promise<string>;

    UPGRADEABLE_IMPLEMENTATION(overrides?: CallOverrides): Promise<string>;

    addHook(
      _signature: BytesLike,
      _implementation: string,
      overrides?: CallOverrides
    ): Promise<void>;

    createContract(
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
      _nonce: BigNumberish,
      _signature: BytesLike,
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

    onERC1155BatchReceived(
      arg0: string,
      arg1: string,
      arg2: BigNumberish[],
      arg3: BigNumberish[],
      arg4: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    onERC1155Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BigNumberish,
      arg4: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    onERC721Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    readGapNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    readHook(_signature: BytesLike, overrides?: CallOverrides): Promise<string>;

    readNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    removeHook(_signature: BytesLike, overrides?: CallOverrides): Promise<void>;

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

    supportsInterface(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    updateImageHash(
      _imageHash: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    updateImplementation(
      _implementation: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "CreatedContract(address)"(
      _contract?: null
    ): TypedEventFilter<[string], { _contract: string }>;

    CreatedContract(
      _contract?: null
    ): TypedEventFilter<[string], { _contract: string }>;

    "GapNonceChange(uint256,uint256,uint256)"(
      _space?: null,
      _oldNonce?: null,
      _newNonce?: null
    ): TypedEventFilter<
      [BigNumber, BigNumber, BigNumber],
      { _space: BigNumber; _oldNonce: BigNumber; _newNonce: BigNumber }
    >;

    GapNonceChange(
      _space?: null,
      _oldNonce?: null,
      _newNonce?: null
    ): TypedEventFilter<
      [BigNumber, BigNumber, BigNumber],
      { _space: BigNumber; _oldNonce: BigNumber; _newNonce: BigNumber }
    >;

    "ImageHashUpdated(bytes32)"(
      newImageHash?: null
    ): TypedEventFilter<[string], { newImageHash: string }>;

    ImageHashUpdated(
      newImageHash?: null
    ): TypedEventFilter<[string], { newImageHash: string }>;

    "ImplementationUpdated(address)"(
      newImplementation?: null
    ): TypedEventFilter<[string], { newImplementation: string }>;

    ImplementationUpdated(
      newImplementation?: null
    ): TypedEventFilter<[string], { newImplementation: string }>;

    "NoNonceUsed()"(): TypedEventFilter<[], {}>;

    NoNonceUsed(): TypedEventFilter<[], {}>;

    "NonceChange(uint256,uint256)"(
      _space?: null,
      _newNonce?: null
    ): TypedEventFilter<
      [BigNumber, BigNumber],
      { _space: BigNumber; _newNonce: BigNumber }
    >;

    NonceChange(
      _space?: null,
      _newNonce?: null
    ): TypedEventFilter<
      [BigNumber, BigNumber],
      { _space: BigNumber; _newNonce: BigNumber }
    >;

    "TxExecuted(bytes32)"(
      _tx?: null
    ): TypedEventFilter<[string], { _tx: string }>;

    TxExecuted(_tx?: null): TypedEventFilter<[string], { _tx: string }>;

    "TxFailed(bytes32,bytes)"(
      _tx?: null,
      _reason?: null
    ): TypedEventFilter<[string, string], { _tx: string; _reason: string }>;

    TxFailed(
      _tx?: null,
      _reason?: null
    ): TypedEventFilter<[string, string], { _tx: string; _reason: string }>;
  };

  estimateGas: {
    FACTORY(overrides?: CallOverrides): Promise<BigNumber>;

    INIT_CODE_HASH(overrides?: CallOverrides): Promise<BigNumber>;

    UPGRADEABLE_IMPLEMENTATION(overrides?: CallOverrides): Promise<BigNumber>;

    addHook(
      _signature: BytesLike,
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    createContract(
      _code: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
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
      _nonce: BigNumberish,
      _signature: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
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

    onERC1155BatchReceived(
      arg0: string,
      arg1: string,
      arg2: BigNumberish[],
      arg3: BigNumberish[],
      arg4: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    onERC1155Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BigNumberish,
      arg4: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    onERC721Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    readGapNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    readHook(
      _signature: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    readNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    removeHook(
      _signature: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
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
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    supportsInterface(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    updateImageHash(
      _imageHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    updateImplementation(
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    FACTORY(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    INIT_CODE_HASH(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    UPGRADEABLE_IMPLEMENTATION(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    addHook(
      _signature: BytesLike,
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    createContract(
      _code: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
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
      _nonce: BigNumberish,
      _signature: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
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

    onERC1155BatchReceived(
      arg0: string,
      arg1: string,
      arg2: BigNumberish[],
      arg3: BigNumberish[],
      arg4: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    onERC1155Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BigNumberish,
      arg4: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    onERC721Received(
      arg0: string,
      arg1: string,
      arg2: BigNumberish,
      arg3: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    readGapNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    readHook(
      _signature: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    readNonce(
      _space: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    removeHook(
      _signature: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
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
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      _interfaceID: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    updateImageHash(
      _imageHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    updateImplementation(
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}

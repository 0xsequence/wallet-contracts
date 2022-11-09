import type { BaseContract, BigNumber, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../common";
export interface ModuleIgnoreAuthUpgradableInterface extends utils.Interface {
    functions: {
        "imageHash()": FunctionFragment;
        "isValidSignature(bytes32,bytes)": FunctionFragment;
        "isValidSignature(bytes,bytes)": FunctionFragment;
        "supportsInterface(bytes4)": FunctionFragment;
        "updateImageHash(bytes32)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "imageHash" | "isValidSignature(bytes32,bytes)" | "isValidSignature(bytes,bytes)" | "supportsInterface" | "updateImageHash"): FunctionFragment;
    encodeFunctionData(functionFragment: "imageHash", values?: undefined): string;
    encodeFunctionData(functionFragment: "isValidSignature(bytes32,bytes)", values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "isValidSignature(bytes,bytes)", values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "updateImageHash", values: [PromiseOrValue<BytesLike>]): string;
    decodeFunctionResult(functionFragment: "imageHash", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValidSignature(bytes32,bytes)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValidSignature(bytes,bytes)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateImageHash", data: BytesLike): Result;
    events: {
        "ImageHashUpdated(bytes32)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "ImageHashUpdated"): EventFragment;
}
export interface ImageHashUpdatedEventObject {
    newImageHash: string;
}
export declare type ImageHashUpdatedEvent = TypedEvent<[
    string
], ImageHashUpdatedEventObject>;
export declare type ImageHashUpdatedEventFilter = TypedEventFilter<ImageHashUpdatedEvent>;
export interface ModuleIgnoreAuthUpgradable extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ModuleIgnoreAuthUpgradableInterface;
    queryFilter<TEvent extends TypedEvent>(event: TypedEventFilter<TEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TEvent>>;
    listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
    listeners(eventName?: string): Array<Listener>;
    removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
    removeAllListeners(eventName?: string): this;
    off: OnEvent<this>;
    on: OnEvent<this>;
    once: OnEvent<this>;
    removeListener: OnEvent<this>;
    functions: {
        imageHash(overrides?: CallOverrides): Promise<[string]>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[string]>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[string]>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[boolean]>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    imageHash(overrides?: CallOverrides): Promise<string>;
    "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
    "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
    supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        imageHash(overrides?: CallOverrides): Promise<string>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "ImageHashUpdated(bytes32)"(newImageHash?: null): ImageHashUpdatedEventFilter;
        ImageHashUpdated(newImageHash?: null): ImageHashUpdatedEventFilter;
    };
    estimateGas: {
        imageHash(overrides?: CallOverrides): Promise<BigNumber>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        imageHash(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}

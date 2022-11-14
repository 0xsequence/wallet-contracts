import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PayableOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../common";
export declare namespace IModuleCalls {
    type TransactionStruct = {
        delegateCall: PromiseOrValue<boolean>;
        revertOnError: PromiseOrValue<boolean>;
        gasLimit: PromiseOrValue<BigNumberish>;
        target: PromiseOrValue<string>;
        value: PromiseOrValue<BigNumberish>;
        data: PromiseOrValue<BytesLike>;
    };
    type TransactionStructOutput = [
        boolean,
        boolean,
        BigNumber,
        string,
        BigNumber,
        string
    ] & {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumber;
        target: string;
        value: BigNumber;
        data: string;
    };
}
export interface GuestModuleInterface extends utils.Interface {
    functions: {
        "createContract(bytes)": FunctionFragment;
        "execute((bool,bool,uint256,address,uint256,bytes)[],uint256,bytes)": FunctionFragment;
        "isValidSignature(bytes32,bytes)": FunctionFragment;
        "isValidSignature(bytes,bytes)": FunctionFragment;
        "nonce()": FunctionFragment;
        "readNonce(uint256)": FunctionFragment;
        "selfExecute((bool,bool,uint256,address,uint256,bytes)[])": FunctionFragment;
        "supportsInterface(bytes4)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "createContract" | "execute" | "isValidSignature(bytes32,bytes)" | "isValidSignature(bytes,bytes)" | "nonce" | "readNonce" | "selfExecute" | "supportsInterface"): FunctionFragment;
    encodeFunctionData(functionFragment: "createContract", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "execute", values: [
        IModuleCalls.TransactionStruct[],
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "isValidSignature(bytes32,bytes)", values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "isValidSignature(bytes,bytes)", values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "nonce", values?: undefined): string;
    encodeFunctionData(functionFragment: "readNonce", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "selfExecute", values: [IModuleCalls.TransactionStruct[]]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [PromiseOrValue<BytesLike>]): string;
    decodeFunctionResult(functionFragment: "createContract", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "execute", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValidSignature(bytes32,bytes)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValidSignature(bytes,bytes)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "nonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "readNonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "selfExecute", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
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
export interface CreatedContractEventObject {
    _contract: string;
}
export declare type CreatedContractEvent = TypedEvent<[
    string
], CreatedContractEventObject>;
export declare type CreatedContractEventFilter = TypedEventFilter<CreatedContractEvent>;
export interface NonceChangeEventObject {
    _space: BigNumber;
    _newNonce: BigNumber;
}
export declare type NonceChangeEvent = TypedEvent<[
    BigNumber,
    BigNumber
], NonceChangeEventObject>;
export declare type NonceChangeEventFilter = TypedEventFilter<NonceChangeEvent>;
export interface TxExecutedEventObject {
    _tx: string;
}
export declare type TxExecutedEvent = TypedEvent<[string], TxExecutedEventObject>;
export declare type TxExecutedEventFilter = TypedEventFilter<TxExecutedEvent>;
export interface TxFailedEventObject {
    _tx: string;
    _reason: string;
}
export declare type TxFailedEvent = TypedEvent<[string, string], TxFailedEventObject>;
export declare type TxFailedEventFilter = TypedEventFilter<TxFailedEvent>;
export interface GuestModule extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: GuestModuleInterface;
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
        createContract(_code: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        execute(_txs: IModuleCalls.TransactionStruct[], arg1: PromiseOrValue<BigNumberish>, arg2: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[string]>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[string]>;
        nonce(overrides?: CallOverrides): Promise<[BigNumber]>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[BigNumber]>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[boolean]>;
    };
    createContract(_code: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    execute(_txs: IModuleCalls.TransactionStruct[], arg1: PromiseOrValue<BigNumberish>, arg2: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
    "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
    nonce(overrides?: CallOverrides): Promise<BigNumber>;
    readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    callStatic: {
        createContract(_code: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        execute(_txs: IModuleCalls.TransactionStruct[], arg1: PromiseOrValue<BigNumberish>, arg2: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        nonce(overrides?: CallOverrides): Promise<BigNumber>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: CallOverrides): Promise<void>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    };
    filters: {
        "CreatedContract(address)"(_contract?: null): CreatedContractEventFilter;
        CreatedContract(_contract?: null): CreatedContractEventFilter;
        "NonceChange(uint256,uint256)"(_space?: null, _newNonce?: null): NonceChangeEventFilter;
        NonceChange(_space?: null, _newNonce?: null): NonceChangeEventFilter;
        "TxExecuted(bytes32)"(_tx?: null): TxExecutedEventFilter;
        TxExecuted(_tx?: null): TxExecutedEventFilter;
        "TxFailed(bytes32,bytes)"(_tx?: null, _reason?: null): TxFailedEventFilter;
        TxFailed(_tx?: null, _reason?: null): TxFailedEventFilter;
    };
    estimateGas: {
        createContract(_code: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        execute(_txs: IModuleCalls.TransactionStruct[], arg1: PromiseOrValue<BigNumberish>, arg2: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        nonce(overrides?: CallOverrides): Promise<BigNumber>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        createContract(_code: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        execute(_txs: IModuleCalls.TransactionStruct[], arg1: PromiseOrValue<BigNumberish>, arg2: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        nonce(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}

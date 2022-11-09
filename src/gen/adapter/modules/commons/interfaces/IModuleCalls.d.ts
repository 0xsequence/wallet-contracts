import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../../common";
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
export interface IModuleCallsInterface extends utils.Interface {
    functions: {
        "execute((bool,bool,uint256,address,uint256,bytes)[],uint256,bytes)": FunctionFragment;
        "nonce()": FunctionFragment;
        "readNonce(uint256)": FunctionFragment;
        "selfExecute((bool,bool,uint256,address,uint256,bytes)[])": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "execute" | "nonce" | "readNonce" | "selfExecute"): FunctionFragment;
    encodeFunctionData(functionFragment: "execute", values: [
        IModuleCalls.TransactionStruct[],
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "nonce", values?: undefined): string;
    encodeFunctionData(functionFragment: "readNonce", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "selfExecute", values: [IModuleCalls.TransactionStruct[]]): string;
    decodeFunctionResult(functionFragment: "execute", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "nonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "readNonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "selfExecute", data: BytesLike): Result;
    events: {
        "NonceChange(uint256,uint256)": EventFragment;
        "TxExecuted(bytes32)": EventFragment;
        "TxFailed(bytes32,bytes)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "NonceChange"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "TxExecuted"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "TxFailed"): EventFragment;
}
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
export interface IModuleCalls extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: IModuleCallsInterface;
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
        execute(_txs: IModuleCalls.TransactionStruct[], _nonce: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        nonce(overrides?: CallOverrides): Promise<[BigNumber]>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[BigNumber]>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    execute(_txs: IModuleCalls.TransactionStruct[], _nonce: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    nonce(overrides?: CallOverrides): Promise<BigNumber>;
    readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        execute(_txs: IModuleCalls.TransactionStruct[], _nonce: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
        nonce(overrides?: CallOverrides): Promise<BigNumber>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "NonceChange(uint256,uint256)"(_space?: null, _newNonce?: null): NonceChangeEventFilter;
        NonceChange(_space?: null, _newNonce?: null): NonceChangeEventFilter;
        "TxExecuted(bytes32)"(_tx?: null): TxExecutedEventFilter;
        TxExecuted(_tx?: null): TxExecutedEventFilter;
        "TxFailed(bytes32,bytes)"(_tx?: null, _reason?: null): TxFailedEventFilter;
        TxFailed(_tx?: null, _reason?: null): TxFailedEventFilter;
    };
    estimateGas: {
        execute(_txs: IModuleCalls.TransactionStruct[], _nonce: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        nonce(overrides?: CallOverrides): Promise<BigNumber>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        execute(_txs: IModuleCalls.TransactionStruct[], _nonce: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        nonce(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}

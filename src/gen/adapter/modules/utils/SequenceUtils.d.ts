import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PayableOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../common";
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
export declare namespace RequireUtils {
    type MemberStruct = {
        weight: PromiseOrValue<BigNumberish>;
        signer: PromiseOrValue<string>;
    };
    type MemberStructOutput = [BigNumber, string] & {
        weight: BigNumber;
        signer: string;
    };
}
export interface SequenceUtilsInterface extends utils.Interface {
    functions: {
        "callBalanceOf(address)": FunctionFragment;
        "callBlockNumber()": FunctionFragment;
        "callBlockhash(uint256)": FunctionFragment;
        "callChainId()": FunctionFragment;
        "callCode(address)": FunctionFragment;
        "callCodeHash(address)": FunctionFragment;
        "callCodeSize(address)": FunctionFragment;
        "callCoinbase()": FunctionFragment;
        "callDifficulty()": FunctionFragment;
        "callGasLeft()": FunctionFragment;
        "callGasLimit()": FunctionFragment;
        "callGasPrice()": FunctionFragment;
        "callOrigin()": FunctionFragment;
        "callTimestamp()": FunctionFragment;
        "knownImageHashes(address)": FunctionFragment;
        "lastImageHashUpdate(bytes32)": FunctionFragment;
        "lastSignerUpdate(address)": FunctionFragment;
        "lastWalletUpdate(address)": FunctionFragment;
        "multiCall((bool,bool,uint256,address,uint256,bytes)[])": FunctionFragment;
        "publishConfig(address,uint256,(uint256,address)[],bool)": FunctionFragment;
        "publishInitialSigners(address,bytes32,uint256,bytes,bool)": FunctionFragment;
        "requireMinNonce(address,uint256)": FunctionFragment;
        "requireNonExpired(uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "callBalanceOf" | "callBlockNumber" | "callBlockhash" | "callChainId" | "callCode" | "callCodeHash" | "callCodeSize" | "callCoinbase" | "callDifficulty" | "callGasLeft" | "callGasLimit" | "callGasPrice" | "callOrigin" | "callTimestamp" | "knownImageHashes" | "lastImageHashUpdate" | "lastSignerUpdate" | "lastWalletUpdate" | "multiCall" | "publishConfig" | "publishInitialSigners" | "requireMinNonce" | "requireNonExpired"): FunctionFragment;
    encodeFunctionData(functionFragment: "callBalanceOf", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "callBlockNumber", values?: undefined): string;
    encodeFunctionData(functionFragment: "callBlockhash", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "callChainId", values?: undefined): string;
    encodeFunctionData(functionFragment: "callCode", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "callCodeHash", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "callCodeSize", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "callCoinbase", values?: undefined): string;
    encodeFunctionData(functionFragment: "callDifficulty", values?: undefined): string;
    encodeFunctionData(functionFragment: "callGasLeft", values?: undefined): string;
    encodeFunctionData(functionFragment: "callGasLimit", values?: undefined): string;
    encodeFunctionData(functionFragment: "callGasPrice", values?: undefined): string;
    encodeFunctionData(functionFragment: "callOrigin", values?: undefined): string;
    encodeFunctionData(functionFragment: "callTimestamp", values?: undefined): string;
    encodeFunctionData(functionFragment: "knownImageHashes", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "lastImageHashUpdate", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "lastSignerUpdate", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "lastWalletUpdate", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "multiCall", values: [IModuleCalls.TransactionStruct[]]): string;
    encodeFunctionData(functionFragment: "publishConfig", values: [
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>,
        RequireUtils.MemberStruct[],
        PromiseOrValue<boolean>
    ]): string;
    encodeFunctionData(functionFragment: "publishInitialSigners", values: [
        PromiseOrValue<string>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<boolean>
    ]): string;
    encodeFunctionData(functionFragment: "requireMinNonce", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "requireNonExpired", values: [PromiseOrValue<BigNumberish>]): string;
    decodeFunctionResult(functionFragment: "callBalanceOf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callBlockNumber", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callBlockhash", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callChainId", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callCode", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callCodeHash", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callCodeSize", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callCoinbase", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callDifficulty", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callGasLeft", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callGasLimit", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callGasPrice", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callOrigin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callTimestamp", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "knownImageHashes", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "lastImageHashUpdate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "lastSignerUpdate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "lastWalletUpdate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "multiCall", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "publishConfig", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "publishInitialSigners", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "requireMinNonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "requireNonExpired", data: BytesLike): Result;
    events: {
        "RequiredConfig(address,bytes32,uint256,bytes)": EventFragment;
        "RequiredSigner(address,address)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "RequiredConfig"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "RequiredSigner"): EventFragment;
}
export interface RequiredConfigEventObject {
    _wallet: string;
    _imageHash: string;
    _threshold: BigNumber;
    _signers: string;
}
export declare type RequiredConfigEvent = TypedEvent<[
    string,
    string,
    BigNumber,
    string
], RequiredConfigEventObject>;
export declare type RequiredConfigEventFilter = TypedEventFilter<RequiredConfigEvent>;
export interface RequiredSignerEventObject {
    _wallet: string;
    _signer: string;
}
export declare type RequiredSignerEvent = TypedEvent<[
    string,
    string
], RequiredSignerEventObject>;
export declare type RequiredSignerEventFilter = TypedEventFilter<RequiredSignerEvent>;
export interface SequenceUtils extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: SequenceUtilsInterface;
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
        callBalanceOf(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber]>;
        callBlockNumber(overrides?: CallOverrides): Promise<[BigNumber]>;
        callBlockhash(_i: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        callChainId(overrides?: CallOverrides): Promise<[BigNumber] & {
            id: BigNumber;
        }>;
        callCode(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[string] & {
            code: string;
        }>;
        callCodeHash(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[string] & {
            codeHash: string;
        }>;
        callCodeSize(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber] & {
            size: BigNumber;
        }>;
        callCoinbase(overrides?: CallOverrides): Promise<[string]>;
        callDifficulty(overrides?: CallOverrides): Promise<[BigNumber]>;
        callGasLeft(overrides?: CallOverrides): Promise<[BigNumber]>;
        callGasLimit(overrides?: CallOverrides): Promise<[BigNumber]>;
        callGasPrice(overrides?: CallOverrides): Promise<[BigNumber]>;
        callOrigin(overrides?: CallOverrides): Promise<[string]>;
        callTimestamp(overrides?: CallOverrides): Promise<[BigNumber]>;
        knownImageHashes(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[string]>;
        lastImageHashUpdate(arg0: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[BigNumber]>;
        lastSignerUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber]>;
        lastWalletUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber]>;
        multiCall(_txs: IModuleCalls.TransactionStruct[], overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        publishConfig(_wallet: PromiseOrValue<string>, _threshold: PromiseOrValue<BigNumberish>, _members: RequireUtils.MemberStruct[], _index: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        publishInitialSigners(_wallet: PromiseOrValue<string>, _hash: PromiseOrValue<BytesLike>, _sizeMembers: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, _index: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        requireMinNonce(_wallet: PromiseOrValue<string>, _nonce: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[void]>;
        requireNonExpired(_expiration: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[void]>;
    };
    callBalanceOf(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    callBlockNumber(overrides?: CallOverrides): Promise<BigNumber>;
    callBlockhash(_i: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    callChainId(overrides?: CallOverrides): Promise<BigNumber>;
    callCode(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<string>;
    callCodeHash(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<string>;
    callCodeSize(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    callCoinbase(overrides?: CallOverrides): Promise<string>;
    callDifficulty(overrides?: CallOverrides): Promise<BigNumber>;
    callGasLeft(overrides?: CallOverrides): Promise<BigNumber>;
    callGasLimit(overrides?: CallOverrides): Promise<BigNumber>;
    callGasPrice(overrides?: CallOverrides): Promise<BigNumber>;
    callOrigin(overrides?: CallOverrides): Promise<string>;
    callTimestamp(overrides?: CallOverrides): Promise<BigNumber>;
    knownImageHashes(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<string>;
    lastImageHashUpdate(arg0: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
    lastSignerUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    lastWalletUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    multiCall(_txs: IModuleCalls.TransactionStruct[], overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    publishConfig(_wallet: PromiseOrValue<string>, _threshold: PromiseOrValue<BigNumberish>, _members: RequireUtils.MemberStruct[], _index: PromiseOrValue<boolean>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    publishInitialSigners(_wallet: PromiseOrValue<string>, _hash: PromiseOrValue<BytesLike>, _sizeMembers: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, _index: PromiseOrValue<boolean>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    requireMinNonce(_wallet: PromiseOrValue<string>, _nonce: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
    requireNonExpired(_expiration: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
    callStatic: {
        callBalanceOf(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        callBlockNumber(overrides?: CallOverrides): Promise<BigNumber>;
        callBlockhash(_i: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        callChainId(overrides?: CallOverrides): Promise<BigNumber>;
        callCode(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<string>;
        callCodeHash(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<string>;
        callCodeSize(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        callCoinbase(overrides?: CallOverrides): Promise<string>;
        callDifficulty(overrides?: CallOverrides): Promise<BigNumber>;
        callGasLeft(overrides?: CallOverrides): Promise<BigNumber>;
        callGasLimit(overrides?: CallOverrides): Promise<BigNumber>;
        callGasPrice(overrides?: CallOverrides): Promise<BigNumber>;
        callOrigin(overrides?: CallOverrides): Promise<string>;
        callTimestamp(overrides?: CallOverrides): Promise<BigNumber>;
        knownImageHashes(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<string>;
        lastImageHashUpdate(arg0: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        lastSignerUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        lastWalletUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        multiCall(_txs: IModuleCalls.TransactionStruct[], overrides?: CallOverrides): Promise<[
            boolean[],
            string[]
        ] & {
            _successes: boolean[];
            _results: string[];
        }>;
        publishConfig(_wallet: PromiseOrValue<string>, _threshold: PromiseOrValue<BigNumberish>, _members: RequireUtils.MemberStruct[], _index: PromiseOrValue<boolean>, overrides?: CallOverrides): Promise<void>;
        publishInitialSigners(_wallet: PromiseOrValue<string>, _hash: PromiseOrValue<BytesLike>, _sizeMembers: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, _index: PromiseOrValue<boolean>, overrides?: CallOverrides): Promise<void>;
        requireMinNonce(_wallet: PromiseOrValue<string>, _nonce: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        requireNonExpired(_expiration: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "RequiredConfig(address,bytes32,uint256,bytes)"(_wallet?: PromiseOrValue<string> | null, _imageHash?: PromiseOrValue<BytesLike> | null, _threshold?: null, _signers?: null): RequiredConfigEventFilter;
        RequiredConfig(_wallet?: PromiseOrValue<string> | null, _imageHash?: PromiseOrValue<BytesLike> | null, _threshold?: null, _signers?: null): RequiredConfigEventFilter;
        "RequiredSigner(address,address)"(_wallet?: PromiseOrValue<string> | null, _signer?: PromiseOrValue<string> | null): RequiredSignerEventFilter;
        RequiredSigner(_wallet?: PromiseOrValue<string> | null, _signer?: PromiseOrValue<string> | null): RequiredSignerEventFilter;
    };
    estimateGas: {
        callBalanceOf(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        callBlockNumber(overrides?: CallOverrides): Promise<BigNumber>;
        callBlockhash(_i: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        callChainId(overrides?: CallOverrides): Promise<BigNumber>;
        callCode(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        callCodeHash(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        callCodeSize(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        callCoinbase(overrides?: CallOverrides): Promise<BigNumber>;
        callDifficulty(overrides?: CallOverrides): Promise<BigNumber>;
        callGasLeft(overrides?: CallOverrides): Promise<BigNumber>;
        callGasLimit(overrides?: CallOverrides): Promise<BigNumber>;
        callGasPrice(overrides?: CallOverrides): Promise<BigNumber>;
        callOrigin(overrides?: CallOverrides): Promise<BigNumber>;
        callTimestamp(overrides?: CallOverrides): Promise<BigNumber>;
        knownImageHashes(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        lastImageHashUpdate(arg0: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        lastSignerUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        lastWalletUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        multiCall(_txs: IModuleCalls.TransactionStruct[], overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        publishConfig(_wallet: PromiseOrValue<string>, _threshold: PromiseOrValue<BigNumberish>, _members: RequireUtils.MemberStruct[], _index: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        publishInitialSigners(_wallet: PromiseOrValue<string>, _hash: PromiseOrValue<BytesLike>, _sizeMembers: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, _index: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        requireMinNonce(_wallet: PromiseOrValue<string>, _nonce: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        requireNonExpired(_expiration: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        callBalanceOf(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callBlockNumber(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callBlockhash(_i: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callChainId(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callCode(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callCodeHash(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callCodeSize(_addr: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callCoinbase(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callDifficulty(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callGasLeft(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callGasLimit(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callGasPrice(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callOrigin(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callTimestamp(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        knownImageHashes(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        lastImageHashUpdate(arg0: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        lastSignerUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        lastWalletUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        multiCall(_txs: IModuleCalls.TransactionStruct[], overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        publishConfig(_wallet: PromiseOrValue<string>, _threshold: PromiseOrValue<BigNumberish>, _members: RequireUtils.MemberStruct[], _index: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        publishInitialSigners(_wallet: PromiseOrValue<string>, _hash: PromiseOrValue<BytesLike>, _sizeMembers: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, _index: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        requireMinNonce(_wallet: PromiseOrValue<string>, _nonce: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        requireNonExpired(_expiration: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}

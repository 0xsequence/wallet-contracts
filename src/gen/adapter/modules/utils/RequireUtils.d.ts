import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../common";
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
export interface RequireUtilsInterface extends utils.Interface {
    functions: {
        "knownImageHashes(address)": FunctionFragment;
        "lastImageHashUpdate(bytes32)": FunctionFragment;
        "lastSignerUpdate(address)": FunctionFragment;
        "lastWalletUpdate(address)": FunctionFragment;
        "publishConfig(address,uint256,(uint256,address)[],bool)": FunctionFragment;
        "publishInitialSigners(address,bytes32,uint256,bytes,bool)": FunctionFragment;
        "requireMinNonce(address,uint256)": FunctionFragment;
        "requireNonExpired(uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "knownImageHashes" | "lastImageHashUpdate" | "lastSignerUpdate" | "lastWalletUpdate" | "publishConfig" | "publishInitialSigners" | "requireMinNonce" | "requireNonExpired"): FunctionFragment;
    encodeFunctionData(functionFragment: "knownImageHashes", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "lastImageHashUpdate", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "lastSignerUpdate", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "lastWalletUpdate", values: [PromiseOrValue<string>]): string;
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
    decodeFunctionResult(functionFragment: "knownImageHashes", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "lastImageHashUpdate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "lastSignerUpdate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "lastWalletUpdate", data: BytesLike): Result;
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
export interface RequireUtils extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: RequireUtilsInterface;
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
        knownImageHashes(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[string]>;
        lastImageHashUpdate(arg0: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[BigNumber]>;
        lastSignerUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber]>;
        lastWalletUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber]>;
        publishConfig(_wallet: PromiseOrValue<string>, _threshold: PromiseOrValue<BigNumberish>, _members: RequireUtils.MemberStruct[], _index: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        publishInitialSigners(_wallet: PromiseOrValue<string>, _hash: PromiseOrValue<BytesLike>, _sizeMembers: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, _index: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        requireMinNonce(_wallet: PromiseOrValue<string>, _nonce: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[void]>;
        requireNonExpired(_expiration: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[void]>;
    };
    knownImageHashes(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<string>;
    lastImageHashUpdate(arg0: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
    lastSignerUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    lastWalletUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    publishConfig(_wallet: PromiseOrValue<string>, _threshold: PromiseOrValue<BigNumberish>, _members: RequireUtils.MemberStruct[], _index: PromiseOrValue<boolean>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    publishInitialSigners(_wallet: PromiseOrValue<string>, _hash: PromiseOrValue<BytesLike>, _sizeMembers: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, _index: PromiseOrValue<boolean>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    requireMinNonce(_wallet: PromiseOrValue<string>, _nonce: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
    requireNonExpired(_expiration: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
    callStatic: {
        knownImageHashes(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<string>;
        lastImageHashUpdate(arg0: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        lastSignerUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        lastWalletUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
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
        knownImageHashes(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        lastImageHashUpdate(arg0: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        lastSignerUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        lastWalletUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
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
        knownImageHashes(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        lastImageHashUpdate(arg0: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        lastSignerUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        lastWalletUpdate(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
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

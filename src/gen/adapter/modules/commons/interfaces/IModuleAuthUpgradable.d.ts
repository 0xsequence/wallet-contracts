import type { BaseContract, BigNumber, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../../common";
export interface IModuleAuthUpgradableInterface extends utils.Interface {
    functions: {
        "imageHash()": FunctionFragment;
        "updateImageHash(bytes32)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "imageHash" | "updateImageHash"): FunctionFragment;
    encodeFunctionData(functionFragment: "imageHash", values?: undefined): string;
    encodeFunctionData(functionFragment: "updateImageHash", values: [PromiseOrValue<BytesLike>]): string;
    decodeFunctionResult(functionFragment: "imageHash", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateImageHash", data: BytesLike): Result;
    events: {};
}
export interface IModuleAuthUpgradable extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: IModuleAuthUpgradableInterface;
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
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    imageHash(overrides?: CallOverrides): Promise<string>;
    updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        imageHash(overrides?: CallOverrides): Promise<string>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {};
    estimateGas: {
        imageHash(overrides?: CallOverrides): Promise<BigNumber>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        imageHash(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}

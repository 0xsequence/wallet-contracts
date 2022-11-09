import type { BaseContract, BigNumber, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../common";
export interface ModuleUpdateInterface extends utils.Interface {
    functions: {
        "supportsInterface(bytes4)": FunctionFragment;
        "updateImplementation(address)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "supportsInterface" | "updateImplementation"): FunctionFragment;
    encodeFunctionData(functionFragment: "supportsInterface", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "updateImplementation", values: [PromiseOrValue<string>]): string;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateImplementation", data: BytesLike): Result;
    events: {
        "ImplementationUpdated(address)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "ImplementationUpdated"): EventFragment;
}
export interface ImplementationUpdatedEventObject {
    newImplementation: string;
}
export declare type ImplementationUpdatedEvent = TypedEvent<[
    string
], ImplementationUpdatedEventObject>;
export declare type ImplementationUpdatedEventFilter = TypedEventFilter<ImplementationUpdatedEvent>;
export interface ModuleUpdate extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ModuleUpdateInterface;
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
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[boolean]>;
        updateImplementation(_implementation: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    updateImplementation(_implementation: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
        updateImplementation(_implementation: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "ImplementationUpdated(address)"(newImplementation?: null): ImplementationUpdatedEventFilter;
        ImplementationUpdated(newImplementation?: null): ImplementationUpdatedEventFilter;
    };
    estimateGas: {
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        updateImplementation(_implementation: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        updateImplementation(_implementation: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}

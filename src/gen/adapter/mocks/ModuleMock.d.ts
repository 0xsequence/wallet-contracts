import type { BaseContract, BigNumber, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../common";
export interface ModuleMockInterface extends utils.Interface {
    functions: {
        "ping()": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "ping"): FunctionFragment;
    encodeFunctionData(functionFragment: "ping", values?: undefined): string;
    decodeFunctionResult(functionFragment: "ping", data: BytesLike): Result;
    events: {
        "Pong()": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Pong"): EventFragment;
}
export interface PongEventObject {
}
export declare type PongEvent = TypedEvent<[], PongEventObject>;
export declare type PongEventFilter = TypedEventFilter<PongEvent>;
export interface ModuleMock extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ModuleMockInterface;
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
        ping(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    ping(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        ping(overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "Pong()"(): PongEventFilter;
        Pong(): PongEventFilter;
    };
    estimateGas: {
        ping(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        ping(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}

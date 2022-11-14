import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../common";
export interface GasBurnerMockInterface extends utils.Interface {
    functions: {
        "burnGas(uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "burnGas"): FunctionFragment;
    encodeFunctionData(functionFragment: "burnGas", values: [PromiseOrValue<BigNumberish>]): string;
    decodeFunctionResult(functionFragment: "burnGas", data: BytesLike): Result;
    events: {
        "ProvidedGas(uint256)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "ProvidedGas"): EventFragment;
}
export interface ProvidedGasEventObject {
    _val: BigNumber;
}
export declare type ProvidedGasEvent = TypedEvent<[BigNumber], ProvidedGasEventObject>;
export declare type ProvidedGasEventFilter = TypedEventFilter<ProvidedGasEvent>;
export interface GasBurnerMock extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: GasBurnerMockInterface;
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
        burnGas(_burn: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    burnGas(_burn: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        burnGas(_burn: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "ProvidedGas(uint256)"(_val?: null): ProvidedGasEventFilter;
        ProvidedGas(_val?: null): ProvidedGasEventFilter;
    };
    estimateGas: {
        burnGas(_burn: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        burnGas(_burn: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}

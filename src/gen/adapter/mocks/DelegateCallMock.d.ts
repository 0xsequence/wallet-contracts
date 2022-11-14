import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../common";
export interface DelegateCallMockInterface extends utils.Interface {
    functions: {
        "read(uint256)": FunctionFragment;
        "setRevertFlag(bool)": FunctionFragment;
        "write(uint256,uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "read" | "setRevertFlag" | "write"): FunctionFragment;
    encodeFunctionData(functionFragment: "read", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "setRevertFlag", values: [PromiseOrValue<boolean>]): string;
    encodeFunctionData(functionFragment: "write", values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]): string;
    decodeFunctionResult(functionFragment: "read", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setRevertFlag", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "write", data: BytesLike): Result;
    events: {
        "Readed(uint256)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Readed"): EventFragment;
}
export interface ReadedEventObject {
    _val: BigNumber;
}
export declare type ReadedEvent = TypedEvent<[BigNumber], ReadedEventObject>;
export declare type ReadedEventFilter = TypedEventFilter<ReadedEvent>;
export interface DelegateCallMock extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: DelegateCallMockInterface;
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
        read(_key: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        setRevertFlag(_revertFlag: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        write(_key: PromiseOrValue<BigNumberish>, _val: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    read(_key: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    setRevertFlag(_revertFlag: PromiseOrValue<boolean>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    write(_key: PromiseOrValue<BigNumberish>, _val: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        read(_key: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        setRevertFlag(_revertFlag: PromiseOrValue<boolean>, overrides?: CallOverrides): Promise<void>;
        write(_key: PromiseOrValue<BigNumberish>, _val: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "Readed(uint256)"(_val?: null): ReadedEventFilter;
        Readed(_val?: null): ReadedEventFilter;
    };
    estimateGas: {
        read(_key: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        setRevertFlag(_revertFlag: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        write(_key: PromiseOrValue<BigNumberish>, _val: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        read(_key: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        setRevertFlag(_revertFlag: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        write(_key: PromiseOrValue<BigNumberish>, _val: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}

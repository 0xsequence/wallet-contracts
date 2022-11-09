import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../common";
export interface IERC223ReceiverInterface extends utils.Interface {
    functions: {
        "tokenFallback(address,uint256,bytes)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "tokenFallback"): FunctionFragment;
    encodeFunctionData(functionFragment: "tokenFallback", values: [
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BytesLike>
    ]): string;
    decodeFunctionResult(functionFragment: "tokenFallback", data: BytesLike): Result;
    events: {};
}
export interface IERC223Receiver extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: IERC223ReceiverInterface;
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
        tokenFallback(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<BigNumberish>, arg2: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    tokenFallback(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<BigNumberish>, arg2: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        tokenFallback(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<BigNumberish>, arg2: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {};
    estimateGas: {
        tokenFallback(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<BigNumberish>, arg2: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        tokenFallback(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<BigNumberish>, arg2: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}

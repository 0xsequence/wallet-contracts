import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../common";
export interface HookMockInterface extends utils.Interface {
    functions: {
        "onHookMockCall(uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "onHookMockCall"): FunctionFragment;
    encodeFunctionData(functionFragment: "onHookMockCall", values: [PromiseOrValue<BigNumberish>]): string;
    decodeFunctionResult(functionFragment: "onHookMockCall", data: BytesLike): Result;
    events: {};
}
export interface HookMock extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: HookMockInterface;
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
        onHookMockCall(_num: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[BigNumber]>;
    };
    onHookMockCall(_num: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    callStatic: {
        onHookMockCall(_num: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    filters: {};
    estimateGas: {
        onHookMockCall(_num: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        onHookMockCall(_num: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}

import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PayableOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../common";
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
export declare namespace MainModuleGasEstimation {
    type SimulateResultStruct = {
        executed: PromiseOrValue<boolean>;
        succeeded: PromiseOrValue<boolean>;
        result: PromiseOrValue<BytesLike>;
        gasUsed: PromiseOrValue<BigNumberish>;
    };
    type SimulateResultStructOutput = [
        boolean,
        boolean,
        string,
        BigNumber
    ] & {
        executed: boolean;
        succeeded: boolean;
        result: string;
        gasUsed: BigNumber;
    };
}
export interface MainModuleGasEstimationInterface extends utils.Interface {
    functions: {
        "addHook(bytes4,address)": FunctionFragment;
        "createContract(bytes)": FunctionFragment;
        "execute((bool,bool,uint256,address,uint256,bytes)[],uint256,bytes)": FunctionFragment;
        "imageHash()": FunctionFragment;
        "isValidSignature(bytes32,bytes)": FunctionFragment;
        "isValidSignature(bytes,bytes)": FunctionFragment;
        "nonce()": FunctionFragment;
        "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)": FunctionFragment;
        "onERC1155Received(address,address,uint256,uint256,bytes)": FunctionFragment;
        "onERC721Received(address,address,uint256,bytes)": FunctionFragment;
        "readHook(bytes4)": FunctionFragment;
        "readNonce(uint256)": FunctionFragment;
        "removeHook(bytes4)": FunctionFragment;
        "selfExecute((bool,bool,uint256,address,uint256,bytes)[])": FunctionFragment;
        "simulateExecute((bool,bool,uint256,address,uint256,bytes)[])": FunctionFragment;
        "supportsInterface(bytes4)": FunctionFragment;
        "updateImageHash(bytes32)": FunctionFragment;
        "updateImplementation(address)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "addHook" | "createContract" | "execute" | "imageHash" | "isValidSignature(bytes32,bytes)" | "isValidSignature(bytes,bytes)" | "nonce" | "onERC1155BatchReceived" | "onERC1155Received" | "onERC721Received" | "readHook" | "readNonce" | "removeHook" | "selfExecute" | "simulateExecute" | "supportsInterface" | "updateImageHash" | "updateImplementation"): FunctionFragment;
    encodeFunctionData(functionFragment: "addHook", values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "createContract", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "execute", values: [
        IModuleCalls.TransactionStruct[],
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "imageHash", values?: undefined): string;
    encodeFunctionData(functionFragment: "isValidSignature(bytes32,bytes)", values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "isValidSignature(bytes,bytes)", values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "nonce", values?: undefined): string;
    encodeFunctionData(functionFragment: "onERC1155BatchReceived", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>[],
        PromiseOrValue<BigNumberish>[],
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "onERC1155Received", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "onERC721Received", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "readHook", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "readNonce", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "removeHook", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "selfExecute", values: [IModuleCalls.TransactionStruct[]]): string;
    encodeFunctionData(functionFragment: "simulateExecute", values: [IModuleCalls.TransactionStruct[]]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "updateImageHash", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "updateImplementation", values: [PromiseOrValue<string>]): string;
    decodeFunctionResult(functionFragment: "addHook", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "createContract", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "execute", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "imageHash", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValidSignature(bytes32,bytes)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValidSignature(bytes,bytes)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "nonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "onERC1155BatchReceived", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "onERC1155Received", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "onERC721Received", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "readHook", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "readNonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "removeHook", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "selfExecute", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "simulateExecute", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateImageHash", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateImplementation", data: BytesLike): Result;
    events: {
        "CreatedContract(address)": EventFragment;
        "ImageHashUpdated(bytes32)": EventFragment;
        "ImplementationUpdated(address)": EventFragment;
        "NonceChange(uint256,uint256)": EventFragment;
        "TxExecuted(bytes32)": EventFragment;
        "TxFailed(bytes32,bytes)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "CreatedContract"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "ImageHashUpdated"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "ImplementationUpdated"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "NonceChange"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "TxExecuted"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "TxFailed"): EventFragment;
}
export interface CreatedContractEventObject {
    _contract: string;
}
export declare type CreatedContractEvent = TypedEvent<[
    string
], CreatedContractEventObject>;
export declare type CreatedContractEventFilter = TypedEventFilter<CreatedContractEvent>;
export interface ImageHashUpdatedEventObject {
    newImageHash: string;
}
export declare type ImageHashUpdatedEvent = TypedEvent<[
    string
], ImageHashUpdatedEventObject>;
export declare type ImageHashUpdatedEventFilter = TypedEventFilter<ImageHashUpdatedEvent>;
export interface ImplementationUpdatedEventObject {
    newImplementation: string;
}
export declare type ImplementationUpdatedEvent = TypedEvent<[
    string
], ImplementationUpdatedEventObject>;
export declare type ImplementationUpdatedEventFilter = TypedEventFilter<ImplementationUpdatedEvent>;
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
export interface MainModuleGasEstimation extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: MainModuleGasEstimationInterface;
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
        addHook(_signature: PromiseOrValue<BytesLike>, _implementation: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        createContract(_code: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        execute(_txs: IModuleCalls.TransactionStruct[], _nonce: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        imageHash(overrides?: CallOverrides): Promise<[string]>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[string]>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[string]>;
        nonce(overrides?: CallOverrides): Promise<[BigNumber]>;
        onERC1155BatchReceived(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>[], arg3: PromiseOrValue<BigNumberish>[], arg4: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        onERC1155Received(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>, arg3: PromiseOrValue<BigNumberish>, arg4: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        onERC721Received(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>, arg3: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        readHook(_signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[string]>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[BigNumber]>;
        removeHook(_signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        simulateExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[boolean]>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        updateImplementation(_implementation: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    addHook(_signature: PromiseOrValue<BytesLike>, _implementation: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    createContract(_code: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    execute(_txs: IModuleCalls.TransactionStruct[], _nonce: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    imageHash(overrides?: CallOverrides): Promise<string>;
    "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
    "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
    nonce(overrides?: CallOverrides): Promise<BigNumber>;
    onERC1155BatchReceived(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>[], arg3: PromiseOrValue<BigNumberish>[], arg4: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    onERC1155Received(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>, arg3: PromiseOrValue<BigNumberish>, arg4: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    onERC721Received(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>, arg3: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    readHook(_signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
    readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    removeHook(_signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    simulateExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    updateImplementation(_implementation: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        addHook(_signature: PromiseOrValue<BytesLike>, _implementation: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        createContract(_code: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        execute(_txs: IModuleCalls.TransactionStruct[], _nonce: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
        imageHash(overrides?: CallOverrides): Promise<string>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        nonce(overrides?: CallOverrides): Promise<BigNumber>;
        onERC1155BatchReceived(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>[], arg3: PromiseOrValue<BigNumberish>[], arg4: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        onERC1155Received(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>, arg3: PromiseOrValue<BigNumberish>, arg4: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        onERC721Received(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>, arg3: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        readHook(_signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        removeHook(_signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: CallOverrides): Promise<void>;
        simulateExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: CallOverrides): Promise<MainModuleGasEstimation.SimulateResultStructOutput[]>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
        updateImplementation(_implementation: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "CreatedContract(address)"(_contract?: null): CreatedContractEventFilter;
        CreatedContract(_contract?: null): CreatedContractEventFilter;
        "ImageHashUpdated(bytes32)"(newImageHash?: null): ImageHashUpdatedEventFilter;
        ImageHashUpdated(newImageHash?: null): ImageHashUpdatedEventFilter;
        "ImplementationUpdated(address)"(newImplementation?: null): ImplementationUpdatedEventFilter;
        ImplementationUpdated(newImplementation?: null): ImplementationUpdatedEventFilter;
        "NonceChange(uint256,uint256)"(_space?: null, _newNonce?: null): NonceChangeEventFilter;
        NonceChange(_space?: null, _newNonce?: null): NonceChangeEventFilter;
        "TxExecuted(bytes32)"(_tx?: null): TxExecutedEventFilter;
        TxExecuted(_tx?: null): TxExecutedEventFilter;
        "TxFailed(bytes32,bytes)"(_tx?: null, _reason?: null): TxFailedEventFilter;
        TxFailed(_tx?: null, _reason?: null): TxFailedEventFilter;
    };
    estimateGas: {
        addHook(_signature: PromiseOrValue<BytesLike>, _implementation: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        createContract(_code: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        execute(_txs: IModuleCalls.TransactionStruct[], _nonce: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        imageHash(overrides?: CallOverrides): Promise<BigNumber>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        nonce(overrides?: CallOverrides): Promise<BigNumber>;
        onERC1155BatchReceived(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>[], arg3: PromiseOrValue<BigNumberish>[], arg4: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        onERC1155Received(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>, arg3: PromiseOrValue<BigNumberish>, arg4: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        onERC721Received(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>, arg3: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        readHook(_signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        removeHook(_signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        simulateExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        updateImplementation(_implementation: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        addHook(_signature: PromiseOrValue<BytesLike>, _implementation: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        createContract(_code: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        execute(_txs: IModuleCalls.TransactionStruct[], _nonce: PromiseOrValue<BigNumberish>, _signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        imageHash(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        "isValidSignature(bytes32,bytes)"(_hash: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        "isValidSignature(bytes,bytes)"(_data: PromiseOrValue<BytesLike>, _signatures: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        nonce(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        onERC1155BatchReceived(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>[], arg3: PromiseOrValue<BigNumberish>[], arg4: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        onERC1155Received(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>, arg3: PromiseOrValue<BigNumberish>, arg4: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        onERC721Received(arg0: PromiseOrValue<string>, arg1: PromiseOrValue<string>, arg2: PromiseOrValue<BigNumberish>, arg3: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        readHook(_signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        readNonce(_space: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        removeHook(_signature: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        selfExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        simulateExecute(_txs: IModuleCalls.TransactionStruct[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        supportsInterface(_interfaceID: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        updateImageHash(_imageHash: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        updateImplementation(_implementation: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}

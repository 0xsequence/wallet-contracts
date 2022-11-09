import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { Factory, FactoryInterface } from "../Factory";
declare type FactoryConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class Factory__factory extends ContractFactory {
    constructor(...args: FactoryConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<Factory>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): Factory;
    connect(signer: Signer): Factory__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b506101c8806100206000396000f3fe60806040526004361061001e5760003560e01c806332c02a1414610023575b600080fd5b61005c6004803603604081101561003957600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135169060200135610085565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b60008060405180606001604052806028815260200161016b602891398473ffffffffffffffffffffffffffffffffffffffff166040516020018083805190602001908083835b6020831061010857805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe090920191602091820191016100cb565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0180199092169116179052920193845250604080518085038152938201905282519294508693508401905034f594935050505056fe603a600e3d39601a805130553df3363d3d373d3d3d363d30545af43d82803e903d91601857fd5bf3a26469706673582212209b0bce93afab3297b9ebf4e58fa642ef123d74bcbd3bdb4e48b662eb12b430ca64736f6c63430007060033";
    static readonly abi: {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): FactoryInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): Factory;
}
export {};

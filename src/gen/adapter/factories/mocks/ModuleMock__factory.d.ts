import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type { ModuleMock, ModuleMockInterface } from "../../mocks/ModuleMock";
declare type ModuleMockConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class ModuleMock__factory extends ContractFactory {
    constructor(...args: ModuleMockConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ModuleMock>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): ModuleMock;
    connect(signer: Signer): ModuleMock__factory;
    static readonly bytecode = "0x6080604052348015600f57600080fd5b5060968061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80635c36b18614602d575b600080fd5b60336035565b005b6040517f4d015fcc2a20c24d7be893b3a525eac864b5a53a5f88ef7201a600465c73314e90600090a156fea26469706673582212201d4403fc62713fef9a01884050dcb3a8fdc4556f1617d27e2024feff5616936364736f6c63430007060033";
    static readonly abi: ({
        anonymous: boolean;
        inputs: never[];
        name: string;
        type: string;
        outputs?: undefined;
        stateMutability?: undefined;
    } | {
        inputs: never[];
        name: string;
        outputs: never[];
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    })[];
    static createInterface(): ModuleMockInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ModuleMock;
}
export {};

import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type { HookMock, HookMockInterface } from "../../mocks/HookMock";
declare type HookMockConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class HookMock__factory extends ContractFactory {
    constructor(...args: HookMockConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<HookMock>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): HookMock;
    connect(signer: Signer): HookMock__factory;
    static readonly bytecode = "0x6080604052348015600f57600080fd5b5060958061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063b68fe6cf14602d575b600080fd5b604760048036036020811015604157600080fd5b50356059565b60408051918252519081900360200190f35b6002029056fea264697066735822122029a1e312dcefda1bc536e0d465373c6d97a053313911fb1a8d3e3c7806aeac1764736f6c63430007060033";
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
    static createInterface(): HookMockInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): HookMock;
}
export {};

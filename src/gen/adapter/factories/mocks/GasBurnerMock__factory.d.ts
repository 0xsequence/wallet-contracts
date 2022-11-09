import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type { GasBurnerMock, GasBurnerMockInterface } from "../../mocks/GasBurnerMock";
declare type GasBurnerMockConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class GasBurnerMock__factory extends ContractFactory {
    constructor(...args: GasBurnerMockConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<GasBurnerMock>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): GasBurnerMock;
    connect(signer: Signer): GasBurnerMock__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b5060f48061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634ad5d16f14602d575b600080fd5b604760048036036020811015604157600080fd5b50356049565b005b7fb5769a7bae701ca7bcd4ed2e803959a466a236728fcb0dc25fa836e3a38bc2225a60408051918252519081900360200190a16000805a90505b825a8203101560b95781604051602001808281526020019150506040516020818303038152906040528051906020012091506083565b50505056fea2646970667358221220fe3bc71490d62993ef7dffc7b978918d19a2693eb8a337dc0037b381bf59da8564736f6c63430007060033";
    static readonly abi: ({
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        outputs?: undefined;
        stateMutability?: undefined;
    } | {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: never[];
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    })[];
    static createInterface(): GasBurnerMockInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): GasBurnerMock;
}
export {};

import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type { Migrations, MigrationsInterface } from "../../migrations/Migrations";
declare type MigrationsConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class Migrations__factory extends ContractFactory {
    constructor(...args: MigrationsConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<Migrations>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): Migrations;
    connect(signer: Signer): Migrations__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b50600080546001600160a01b03191633179055610202806100326000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80630900f01014610051578063445df0ac146100865780638da5cb5b146100a0578063fdacd576146100d1575b600080fd5b6100846004803603602081101561006757600080fd5b503573ffffffffffffffffffffffffffffffffffffffff166100ee565b005b61008e610185565b60408051918252519081900360200190f35b6100a861018b565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b610084600480360360208110156100e757600080fd5b50356101a7565b60005473ffffffffffffffffffffffffffffffffffffffff163314156101825760008190508073ffffffffffffffffffffffffffffffffffffffff1663fdacd5766001546040518263ffffffff1660e01b815260040180828152602001915050600060405180830381600087803b15801561016857600080fd5b505af115801561017c573d6000803e3d6000fd5b50505050505b50565b60015481565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b60005473ffffffffffffffffffffffffffffffffffffffff163314156101825760015556fea2646970667358221220c356fd16dd98acec36d2966175de7f7a7fa5a8bb405384b0de6773cfb8ada45864736f6c63430007060033";
    static readonly abi: ({
        inputs: never[];
        stateMutability: string;
        type: string;
        name?: undefined;
        outputs?: undefined;
    } | {
        inputs: never[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
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
    })[];
    static createInterface(): MigrationsInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): Migrations;
}
export {};

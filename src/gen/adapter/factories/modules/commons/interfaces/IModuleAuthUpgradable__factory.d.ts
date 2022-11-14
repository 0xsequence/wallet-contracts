import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IModuleAuthUpgradable, IModuleAuthUpgradableInterface } from "../../../../modules/commons/interfaces/IModuleAuthUpgradable";
export declare class IModuleAuthUpgradable__factory {
    static readonly abi: ({
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
    static createInterface(): IModuleAuthUpgradableInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IModuleAuthUpgradable;
}

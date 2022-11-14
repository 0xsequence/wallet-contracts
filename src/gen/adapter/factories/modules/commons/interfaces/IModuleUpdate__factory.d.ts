import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IModuleUpdate, IModuleUpdateInterface } from "../../../../modules/commons/interfaces/IModuleUpdate";
export declare class IModuleUpdate__factory {
    static readonly abi: {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: never[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): IModuleUpdateInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IModuleUpdate;
}

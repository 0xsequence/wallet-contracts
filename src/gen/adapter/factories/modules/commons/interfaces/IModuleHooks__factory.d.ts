import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IModuleHooks, IModuleHooksInterface } from "../../../../modules/commons/interfaces/IModuleHooks";
export declare class IModuleHooks__factory {
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
    static createInterface(): IModuleHooksInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IModuleHooks;
}

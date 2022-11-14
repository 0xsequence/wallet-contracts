import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ModuleERC165, ModuleERC165Interface } from "../../../modules/commons/ModuleERC165";
export declare class ModuleERC165__factory {
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
    static createInterface(): ModuleERC165Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): ModuleERC165;
}

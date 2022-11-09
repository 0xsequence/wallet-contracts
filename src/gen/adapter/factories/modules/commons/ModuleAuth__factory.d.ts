import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ModuleAuth, ModuleAuthInterface } from "../../../modules/commons/ModuleAuth";
export declare class ModuleAuth__factory {
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
    static createInterface(): ModuleAuthInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ModuleAuth;
}

import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IModuleCreator, IModuleCreatorInterface } from "../../../../modules/commons/interfaces/IModuleCreator";
export declare class IModuleCreator__factory {
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
    static createInterface(): IModuleCreatorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IModuleCreator;
}

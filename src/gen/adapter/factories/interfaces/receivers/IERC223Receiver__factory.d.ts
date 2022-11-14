import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IERC223Receiver, IERC223ReceiverInterface } from "../../../interfaces/receivers/IERC223Receiver";
export declare class IERC223Receiver__factory {
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
    static createInterface(): IERC223ReceiverInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC223Receiver;
}

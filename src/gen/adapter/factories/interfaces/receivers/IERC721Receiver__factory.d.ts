import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IERC721Receiver, IERC721ReceiverInterface } from "../../../interfaces/receivers/IERC721Receiver";
export declare class IERC721Receiver__factory {
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
    static createInterface(): IERC721ReceiverInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC721Receiver;
}

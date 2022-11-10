/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IModuleCreator__factory = void 0;
const ethers_1 = require("ethers");
const _abi = [
    {
        inputs: [
            {
                internalType: "bytes",
                name: "_code",
                type: "bytes",
            },
        ],
        name: "createContract",
        outputs: [
            {
                internalType: "address",
                name: "addr",
                type: "address",
            },
        ],
        stateMutability: "payable",
        type: "function",
    },
];
class IModuleCreator__factory {
    static createInterface() {
        return new ethers_1.utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.IModuleCreator__factory = IModuleCreator__factory;
IModuleCreator__factory.abi = _abi;

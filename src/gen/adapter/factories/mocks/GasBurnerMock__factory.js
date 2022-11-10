Object.defineProperty(exports, "__esModule", { value: true });
exports.GasBurnerMock__factory = void 0;
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
const ethers_1 = require("ethers");
const _abi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "_val",
                type: "uint256",
            },
        ],
        name: "ProvidedGas",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_burn",
                type: "uint256",
            },
        ],
        name: "burnGas",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
const _bytecode = "0x608060405234801561001057600080fd5b5060f48061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634ad5d16f14602d575b600080fd5b604760048036036020811015604157600080fd5b50356049565b005b7fb5769a7bae701ca7bcd4ed2e803959a466a236728fcb0dc25fa836e3a38bc2225a60408051918252519081900360200190a16000805a90505b825a8203101560b95781604051602001808281526020019150506040516020818303038152906040528051906020012091506083565b50505056fea2646970667358221220fe3bc71490d62993ef7dffc7b978918d19a2693eb8a337dc0037b381bf59da8564736f6c63430007060033";
const isSuperArgs = (xs) => xs.length > 1;
class GasBurnerMock__factory extends ethers_1.ContractFactory {
    constructor(...args) {
        if (isSuperArgs(args)) {
            super(...args);
        }
        else {
            super(_abi, _bytecode, args[0]);
        }
    }
    deploy(overrides) {
        return super.deploy(overrides || {});
    }
    getDeployTransaction(overrides) {
        return super.getDeployTransaction(overrides || {});
    }
    attach(address) {
        return super.attach(address);
    }
    connect(signer) {
        return super.connect(signer);
    }
    static createInterface() {
        return new ethers_1.utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.GasBurnerMock__factory = GasBurnerMock__factory;
GasBurnerMock__factory.bytecode = _bytecode;
GasBurnerMock__factory.abi = _abi;

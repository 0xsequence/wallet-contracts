"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
exports.__esModule = true;
exports.ModuleCalls__factory = void 0;
var ethers_1 = require("ethers");
var _abi = [
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_space",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "_provided",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "_current",
                type: "uint256"
            },
        ],
        name: "BadGapNonce",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_space",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "_provided",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "_current",
                type: "uint256"
            },
        ],
        name: "BadNonce",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_space",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "_nonce",
                type: "uint256"
            },
        ],
        name: "ExpectedEmptyNonce",
        type: "error"
    },
    {
        inputs: [],
        name: "ImageHashIsZero",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "_hash",
                type: "bytes32"
            },
            {
                internalType: "address",
                name: "_addr",
                type: "address"
            },
            {
                internalType: "bytes",
                name: "_signature",
                type: "bytes"
            },
        ],
        name: "InvalidNestedSignature",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_type",
                type: "uint256"
            },
        ],
        name: "InvalidNonceType",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "_hash",
                type: "bytes32"
            },
            {
                internalType: "bytes",
                name: "_signature",
                type: "bytes"
            },
        ],
        name: "InvalidSignature",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_flag",
                type: "uint256"
            },
        ],
        name: "InvalidSignatureFlag",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_type",
                type: "uint256"
            },
        ],
        name: "InvalidSignatureType",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_requested",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "_available",
                type: "uint256"
            },
        ],
        name: "NotEnoughGas",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_sender",
                type: "address"
            },
            {
                internalType: "address",
                name: "_self",
                type: "address"
            },
        ],
        name: "OnlySelfAuth",
        type: "error"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "_space",
                type: "uint256"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "_oldNonce",
                type: "uint256"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "_newNonce",
                type: "uint256"
            },
        ],
        name: "GapNonceChange",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "bytes32",
                name: "newImageHash",
                type: "bytes32"
            },
        ],
        name: "ImageHashUpdated",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [],
        name: "NoNonceUsed",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "_space",
                type: "uint256"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "_newNonce",
                type: "uint256"
            },
        ],
        name: "NonceChange",
        type: "event"
    },
    {
        anonymous: true,
        inputs: [
            {
                indexed: false,
                internalType: "bytes32",
                name: "_tx",
                type: "bytes32"
            },
        ],
        name: "TxExecuted",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "bytes32",
                name: "_tx",
                type: "bytes32"
            },
            {
                indexed: false,
                internalType: "bytes",
                name: "_reason",
                type: "bytes"
            },
        ],
        name: "TxFailed",
        type: "event"
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "bool",
                        name: "delegateCall",
                        type: "bool"
                    },
                    {
                        internalType: "bool",
                        name: "revertOnError",
                        type: "bool"
                    },
                    {
                        internalType: "uint256",
                        name: "gasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "address",
                        name: "target",
                        type: "address"
                    },
                    {
                        internalType: "uint256",
                        name: "value",
                        type: "uint256"
                    },
                    {
                        internalType: "bytes",
                        name: "data",
                        type: "bytes"
                    },
                ],
                internalType: "struct IModuleCalls.Transaction[]",
                name: "_txs",
                type: "tuple[]"
            },
            {
                internalType: "uint256",
                name: "_nonce",
                type: "uint256"
            },
            {
                internalType: "bytes",
                name: "_signature",
                type: "bytes"
            },
        ],
        name: "execute",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "nonce",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_space",
                type: "uint256"
            },
        ],
        name: "readGapNonce",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_space",
                type: "uint256"
            },
        ],
        name: "readNonce",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "bool",
                        name: "delegateCall",
                        type: "bool"
                    },
                    {
                        internalType: "bool",
                        name: "revertOnError",
                        type: "bool"
                    },
                    {
                        internalType: "uint256",
                        name: "gasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "address",
                        name: "target",
                        type: "address"
                    },
                    {
                        internalType: "uint256",
                        name: "value",
                        type: "uint256"
                    },
                    {
                        internalType: "bytes",
                        name: "data",
                        type: "bytes"
                    },
                ],
                internalType: "struct IModuleCalls.Transaction[]",
                name: "_txs",
                type: "tuple[]"
            },
        ],
        name: "selfExecute",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "bytes4",
                name: "_interfaceID",
                type: "bytes4"
            },
        ],
        name: "supportsInterface",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool"
            },
        ],
        stateMutability: "pure",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "_imageHash",
                type: "bytes32"
            },
        ],
        name: "updateImageHash",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
];
var ModuleCalls__factory = /** @class */ (function () {
    function ModuleCalls__factory() {
    }
    ModuleCalls__factory.createInterface = function () {
        return new ethers_1.utils.Interface(_abi);
    };
    ModuleCalls__factory.connect = function (address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    };
    ModuleCalls__factory.abi = _abi;
    return ModuleCalls__factory;
}());
exports.ModuleCalls__factory = ModuleCalls__factory;

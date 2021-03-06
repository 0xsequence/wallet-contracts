"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
exports.__esModule = true;
exports.IModuleHooks__factory = void 0;
var ethers_1 = require("ethers");
var IModuleHooks__factory = /** @class */ (function () {
    function IModuleHooks__factory() {
    }
    IModuleHooks__factory.connect = function (address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    };
    return IModuleHooks__factory;
}());
exports.IModuleHooks__factory = IModuleHooks__factory;
var _abi = [
    {
        inputs: [
            {
                internalType: "bytes4",
                name: "_signature",
                type: "bytes4"
            },
            {
                internalType: "address",
                name: "_implementation",
                type: "address"
            },
        ],
        name: "addHook",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "bytes4",
                name: "_signature",
                type: "bytes4"
            },
        ],
        name: "readHook",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "bytes4",
                name: "_signature",
                type: "bytes4"
            },
        ],
        name: "removeHook",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
];

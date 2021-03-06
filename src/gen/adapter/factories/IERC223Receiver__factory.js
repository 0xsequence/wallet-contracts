"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
exports.__esModule = true;
exports.IERC223Receiver__factory = void 0;
var ethers_1 = require("ethers");
var IERC223Receiver__factory = /** @class */ (function () {
    function IERC223Receiver__factory() {
    }
    IERC223Receiver__factory.connect = function (address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    };
    return IERC223Receiver__factory;
}());
exports.IERC223Receiver__factory = IERC223Receiver__factory;
var _abi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
            {
                internalType: "bytes",
                name: "",
                type: "bytes"
            },
        ],
        name: "tokenFallback",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
];

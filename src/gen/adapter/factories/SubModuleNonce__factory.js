"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.SubModuleNonce__factory = void 0;
var ethers_1 = require("ethers");
var _abi = [
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
];
var _bytecode = "0x60566037600b82828239805160001a607314602a57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600080fdfea26469706673582212204976e9a55805d8919121897b83a83df1629b6d243daaba7f248d90ed791690f164736f6c634300080e0033";
var SubModuleNonce__factory = /** @class */ (function (_super) {
    __extends(SubModuleNonce__factory, _super);
    function SubModuleNonce__factory() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _this = this;
        if (args.length === 1) {
            _this = _super.call(this, _abi, _bytecode, args[0]) || this;
        }
        else {
            _this = _super.apply(this, args) || this;
        }
        return _this;
    }
    SubModuleNonce__factory.prototype.deploy = function (overrides) {
        return _super.prototype.deploy.call(this, overrides || {});
    };
    SubModuleNonce__factory.prototype.getDeployTransaction = function (overrides) {
        return _super.prototype.getDeployTransaction.call(this, overrides || {});
    };
    SubModuleNonce__factory.prototype.attach = function (address) {
        return _super.prototype.attach.call(this, address);
    };
    SubModuleNonce__factory.prototype.connect = function (signer) {
        return _super.prototype.connect.call(this, signer);
    };
    SubModuleNonce__factory.createInterface = function () {
        return new ethers_1.utils.Interface(_abi);
    };
    SubModuleNonce__factory.connect = function (address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    };
    SubModuleNonce__factory.bytecode = _bytecode;
    SubModuleNonce__factory.abi = _abi;
    return SubModuleNonce__factory;
}(ethers_1.ContractFactory));
exports.SubModuleNonce__factory = SubModuleNonce__factory;

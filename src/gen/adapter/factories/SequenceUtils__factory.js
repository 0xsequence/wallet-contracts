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
exports.SequenceUtils__factory = void 0;
var ethers_1 = require("ethers");
var _abi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "_factory",
                type: "address"
            },
            {
                internalType: "address",
                name: "_mainModule",
                type: "address"
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_index",
                type: "uint256"
            },
            {
                internalType: "bytes",
                name: "_result",
                type: "bytes"
            },
        ],
        name: "CallReverted",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_index",
                type: "uint256"
            },
        ],
        name: "DelegateCallNotAllowed",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "bytes",
                name: "_signature",
                type: "bytes"
            },
            {
                internalType: "bytes32",
                name: "_s",
                type: "bytes32"
            },
        ],
        name: "InvalidSValue",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "bytes",
                name: "_signature",
                type: "bytes"
            },
        ],
        name: "InvalidSignatureLength",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "bytes",
                name: "_signature",
                type: "bytes"
            },
            {
                internalType: "uint256",
                name: "_v",
                type: "uint256"
            },
        ],
        name: "InvalidVValue",
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
                internalType: "bytes",
                name: "_data",
                type: "bytes"
            },
        ],
        name: "ReadFirstUint16OutOfBounds",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "bytes",
                name: "_signature",
                type: "bytes"
            },
        ],
        name: "SignerIsAddress0",
        type: "error"
    },
    {
        inputs: [
            {
                internalType: "bytes",
                name: "_signature",
                type: "bytes"
            },
            {
                internalType: "uint256",
                name: "_type",
                type: "uint256"
            },
            {
                internalType: "bool",
                name: "_recoverMode",
                type: "bool"
            },
        ],
        name: "UnsupportedSignatureType",
        type: "error"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "_wallet",
                type: "address"
            },
            {
                indexed: true,
                internalType: "bytes32",
                name: "_imageHash",
                type: "bytes32"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "_threshold",
                type: "uint256"
            },
            {
                indexed: false,
                internalType: "bytes",
                name: "_signers",
                type: "bytes"
            },
        ],
        name: "RequiredConfig",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "_wallet",
                type: "address"
            },
            {
                indexed: true,
                internalType: "address",
                name: "_signer",
                type: "address"
            },
        ],
        name: "RequiredSigner",
        type: "event"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_addr",
                type: "address"
            },
        ],
        name: "callBalanceOf",
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
        inputs: [],
        name: "callBlockNumber",
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
                name: "_i",
                type: "uint256"
            },
        ],
        name: "callBlockhash",
        outputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "callChainId",
        outputs: [
            {
                internalType: "uint256",
                name: "id",
                type: "uint256"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_addr",
                type: "address"
            },
        ],
        name: "callCode",
        outputs: [
            {
                internalType: "bytes",
                name: "code",
                type: "bytes"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_addr",
                type: "address"
            },
        ],
        name: "callCodeHash",
        outputs: [
            {
                internalType: "bytes32",
                name: "codeHash",
                type: "bytes32"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_addr",
                type: "address"
            },
        ],
        name: "callCodeSize",
        outputs: [
            {
                internalType: "uint256",
                name: "size",
                type: "uint256"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "callCoinbase",
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
        inputs: [],
        name: "callDifficulty",
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
        inputs: [],
        name: "callGasLeft",
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
        inputs: [],
        name: "callGasLimit",
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
        inputs: [],
        name: "callGasPrice",
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
        inputs: [],
        name: "callOrigin",
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
        inputs: [],
        name: "callTimestamp",
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
                internalType: "address",
                name: "",
                type: "address"
            },
        ],
        name: "knownImageHashes",
        outputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32"
            },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32"
            },
        ],
        name: "lastImageHashUpdate",
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
                internalType: "address",
                name: "",
                type: "address"
            },
        ],
        name: "lastSignerUpdate",
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
                internalType: "address",
                name: "",
                type: "address"
            },
        ],
        name: "lastWalletUpdate",
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
        name: "multiCall",
        outputs: [
            {
                internalType: "bool[]",
                name: "_successes",
                type: "bool[]"
            },
            {
                internalType: "bytes[]",
                name: "_results",
                type: "bytes[]"
            },
        ],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_wallet",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "_threshold",
                type: "uint256"
            },
            {
                components: [
                    {
                        internalType: "uint256",
                        name: "weight",
                        type: "uint256"
                    },
                    {
                        internalType: "address",
                        name: "signer",
                        type: "address"
                    },
                ],
                internalType: "struct RequireUtils.Member[]",
                name: "_members",
                type: "tuple[]"
            },
            {
                internalType: "bool",
                name: "_index",
                type: "bool"
            },
        ],
        name: "publishConfig",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_wallet",
                type: "address"
            },
            {
                internalType: "bytes32",
                name: "_hash",
                type: "bytes32"
            },
            {
                internalType: "uint256",
                name: "_sizeMembers",
                type: "uint256"
            },
            {
                internalType: "bytes",
                name: "_signature",
                type: "bytes"
            },
            {
                internalType: "bool",
                name: "_index",
                type: "bool"
            },
        ],
        name: "publishInitialSigners",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_wallet",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "_nonce",
                type: "uint256"
            },
        ],
        name: "requireMinNonce",
        outputs: [],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_expiration",
                type: "uint256"
            },
        ],
        name: "requireNonExpired",
        outputs: [],
        stateMutability: "view",
        type: "function"
    },
];
var _bytecode = "0x60c06040523480156200001157600080fd5b5060405162002512380380620025128339810160408190526200003491620000be565b6001600160a01b03821660a0526040805160608101909152602880825283918391620024ea6020830139816001600160a01b03166040516020016200007b929190620000f6565b60408051601f198184030181529190528051602090910120608052506200013a92505050565b80516001600160a01b0381168114620000b957600080fd5b919050565b60008060408385031215620000d257600080fd5b620000dd83620000a1565b9150620000ed60208401620000a1565b90509250929050565b6000835160005b81811015620001195760208187018101518583015201620000fd565b8181111562000129576000828501525b509190910191825250602001919050565b60805160a05161237c6200016e600039600081816106f50152610dcd0152600081816107260152610dfe015261237c6000f3fe6080604052600436106101805760003560e01c806398f9fbc4116100d6578063d1db39071161007f578063e90f13e711610059578063e90f13e7146103d2578063f209883a14610431578063ffd7d7411461044457600080fd5b8063d1db3907146103d2578063d5b5337f146103e5578063e717aba91461040457600080fd5b8063c272d5c3116100b0578063c272d5c314610373578063c39f2d5c14610386578063c66764e1146103a557600080fd5b806398f9fbc41461032d578063aeea5fb514610340578063b472f0a21461035357600080fd5b806348acd29f116101385780637ae99638116101125780637ae99638146102ac5780637f29d538146102d9578063984395bc146102f957600080fd5b806348acd29f14610238578063543196eb1461026d5780637082503b1461028c57600080fd5b80631cd05dc4116101695780631cd05dc4146101d457806343d9c9351461020157806344d466c21461021657600080fd5b80630fdecfac146101855780631551f0ab146101a7575b600080fd5b34801561019157600080fd5b50465b6040519081526020015b60405180910390f35b3480156101b357600080fd5b506101946101c2366004611a57565b60036020526000908152604090205481565b3480156101e057600080fd5b506101946101ef366004611a99565b60006020819052908152604090205481565b34801561020d57600080fd5b50610194610465565b34801561022257600080fd5b50610236610231366004611acb565b61046d565b005b34801561024457600080fd5b50610194610253366004611a99565b73ffffffffffffffffffffffffffffffffffffffff163190565b34801561027957600080fd5b50610194610288366004611a99565b3f90565b34801561029857600080fd5b506102366102a7366004611b6c565b61092a565b3480156102b857600080fd5b506101946102c7366004611a99565b60026020526000908152604090205481565b3480156102e557600080fd5b506102366102f4366004611a57565b611003565b34801561030557600080fd5b50325b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200161019e565b34801561033957600080fd5b5041610308565b34801561034c57600080fd5b5044610194565b34801561035f57600080fd5b5061023661036e366004611c12565b611095565b34801561037f57600080fd5b503a610194565b34801561039257600080fd5b506101946103a1366004611a99565b3b90565b3480156103b157600080fd5b506103c56103c0366004611a99565b6111d1565b60405161019e9190611cb6565b3480156103de57600080fd5b5045610194565b3480156103f157600080fd5b50610194610400366004611a57565b4090565b34801561041057600080fd5b5061019461041f366004611a99565b60016020526000908152604090205481565b34801561043d57600080fd5b5042610194565b610457610452366004611d70565b611216565b60405161019e929190611f2a565b60005a905090565b8360005b8381101561051b578185858381811061048c5761048c611fe2565b905060400201600001358686848181106104a8576104a8611fe2565b90506040020160200160208101906104c09190611a99565b60408051602081019490945283019190915273ffffffffffffffffffffffffffffffffffffffff166060820152608001604051602081830303815290604052805190602001209150808061051390612040565b915050610471565b506040517f51605d80000000000000000000000000000000000000000000000000000000006020820152600090819073ffffffffffffffffffffffffffffffffffffffff891690602401604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905261059d91612078565b6000604051808303816000865af19150503d80600081146105da576040519150601f19603f3d011682016040523d82523d6000602084013e6105df565b606091505b50915091508180156105f2575080516020145b156106a95760008180602001905181019061060d9190612094565b90508381146106a3576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603160248201527f526571756972655574696c73237075626c697368436f6e6669673a20554e455860448201527f5045435445445f494d4147455f4841534800000000000000000000000000000060648201526084015b60405180910390fd5b50610852565b6040517fff0000000000000000000000000000000000000000000000000000000000000060208201527fffffffffffffffffffffffffffffffffffffffff0000000000000000000000007f000000000000000000000000000000000000000000000000000000000000000060601b166021820152603581018490527f0000000000000000000000000000000000000000000000000000000000000000605582015273ffffffffffffffffffffffffffffffffffffffff8916906075016040516020818303038152906040528051906020012060001c73ffffffffffffffffffffffffffffffffffffffff161461082357604080517f08c379a00000000000000000000000000000000000000000000000000000000081526020600482015260248101919091527f526571756972655574696c73237075626c697368436f6e6669673a20554e455860448201527f5045435445445f434f554e5445524641435455414c5f494d4147455f48415348606482015260840161069a565b83156108525773ffffffffffffffffffffffffffffffffffffffff881660009081526002602052604090208390555b828873ffffffffffffffffffffffffffffffffffffffff167fb502b7446ca079086188acf3abef47c2f464f2ee9a72fcdf05ffcb74dcc17cee89898960405160200161089f9291906120ad565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0818403018152908290526108d89291612111565b60405180910390a383156109205773ffffffffffffffffffffffffffffffffffffffff8816600090815260016020908152604080832043908190558684526003909252909120555b5050505050505050565b60008061093785856114e1565b604080517f190100000000000000000000000000000000000000000000000000000000000060208083019190915246602283015260608d901b7fffffffffffffffffffffffffffffffffffffffff00000000000000000000000016604283015260568083018d90528351808403909101815260769092019092528051910120919350915061ffff831660008867ffffffffffffffff8111156109db576109db611cc9565b604051908082528060200260200182016040528015610a2057816020015b60408051808201909152600080825260208201528152602001906001900390816109f95790505b50905060005b87851015610cf257600285019489013560f881901c9060f01c60ff1660007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8301610a7c575060148701968b013560601c610c4a565b82610ac457610aa5878d8a8e610a93826042612132565b92610aa09392919061214a565b611530565b9050610ab2604289612132565b9750610abf8f828c6117f3565b610c4a565b60028303610bc257878c013560601c601489019850905060008c89013560f01c60028a018161ffff169150809a508192505050610b1e88838f8f8d90868f610b0c9190612132565b92610b199392919061214a565b611881565b610baa576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603260248201527f4d6f64756c6541757468235f7369676e617475726556616c69646174696f6e3a60448201527f20494e56414c49445f5349474e41545552450000000000000000000000000000606482015260840161069a565b610bb4818a612132565b985050610abf8f828c6117f3565b6040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603a60248201527f526571756972655574696c73237075626c697368496e697469616c5369676e6560448201527f72733a20494e56414c49445f5349474e41545552455f464c4147000000000000606482015260840161069a565b60405180604001604052808381526020018273ffffffffffffffffffffffffffffffffffffffff16815250858581518110610c8757610c87611fe2565b60200260200101819052508380610c9d90612040565b60408051602081018a905290810185905273ffffffffffffffffffffffffffffffffffffffff841660608201529095506080019050604051602081830303815290604052805190602001209550505050610a26565b898114610d81576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603960248201527f526571756972655574696c73237075626c697368496e697469616c5369676e6560448201527f72733a20494e56414c49445f4d454d424552535f434f554e5400000000000000606482015260840161069a565b6040517fff0000000000000000000000000000000000000000000000000000000000000060208201527fffffffffffffffffffffffffffffffffffffffff0000000000000000000000007f000000000000000000000000000000000000000000000000000000000000000060601b166021820152603581018490527f0000000000000000000000000000000000000000000000000000000000000000605582015273ffffffffffffffffffffffffffffffffffffffff8d16906075016040516020818303038152906040528051906020012060001c73ffffffffffffffffffffffffffffffffffffffff1614610f1f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604860248201527f526571756972655574696c73237075626c697368496e697469616c5369676e6560448201527f72733a20554e45585045435445445f434f554e5445524641435455414c5f494d60648201527f4147455f48415348000000000000000000000000000000000000000000000000608482015260a40161069a565b828c73ffffffffffffffffffffffffffffffffffffffff167fb502b7446ca079086188acf3abef47c2f464f2ee9a72fcdf05ffcb74dcc17cee8885604051602001610f6a9190612174565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe081840301815290829052610fa392916121d9565b60405180910390a38615610ff55773ffffffffffffffffffffffffffffffffffffffff8c1660008181526001602090815260408083204390819055878452600383528184205592825260029052208390555b505050505050505050505050565b804210611092576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602760248201527f526571756972655574696c7323726571756972654e6f6e457870697265643a2060448201527f4558504952454400000000000000000000000000000000000000000000000000606482015260840161069a565b50565b6000806110a183611a2e565b6040517f8c3f556300000000000000000000000000000000000000000000000000000000815260048101839052919350915060009073ffffffffffffffffffffffffffffffffffffffff861690638c3f556390602401602060405180830381865afa158015611114573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111389190612094565b9050818110156111ca576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603260248201527f526571756972655574696c7323726571756972654d696e4e6f6e63653a204e4f60448201527f4e43455f42454c4f575f52455155495245440000000000000000000000000000606482015260840161069a565b5050505050565b60408051603f833b9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682019092528181529080600060208401853c50919050565b606080825167ffffffffffffffff81111561123357611233611cc9565b60405190808252806020026020018201604052801561125c578160200160208202803683370190505b509150825167ffffffffffffffff81111561127957611279611cc9565b6040519080825280602002602001820160405280156112ac57816020015b60608152602001906001900390816112975790505b50905060005b83518110156114db5760008482815181106112cf576112cf611fe2565b60200260200101519050806000015115611318576040517f230d1ccc0000000000000000000000000000000000000000000000000000000081526004810183905260240161069a565b80604001515a10156113655780604001515a6040517f9fa729820000000000000000000000000000000000000000000000000000000081526004810192909252602482015260440161069a565b806060015173ffffffffffffffffffffffffffffffffffffffff168160800151826040015160001461139b57826040015161139d565b5a5b908360a001516040516113b09190612078565b600060405180830381858888f193505050503d80600081146113ee576040519150601f19603f3d011682016040523d82523d6000602084013e6113f3565b606091505b5085848151811061140657611406611fe2565b6020026020010185858151811061141f5761141f611fe2565b602002602001018290528215151515815250505083828151811061144557611445611fe2565b6020026020010151158015611474575084828151811061146757611467611fe2565b6020026020010151602001515b156114c8578183838151811061148c5761148c611fe2565b60200260200101516040517f3b4c7a5f00000000000000000000000000000000000000000000000000000000815260040161069a929190612111565b50806114d381612040565b9150506112b2565b50915091565b60008060028310156115235783836040517f857f2c1a00000000000000000000000000000000000000000000000000000000815260040161069a92919061223f565b5050503560f01c90600290565b6000604282146115705782826040517f2ee17a3d00000000000000000000000000000000000000000000000000000000815260040161069a92919061223f565b6000611589611580600185612253565b85013560f81c90565b60ff169050604084013560f81c843560208601357f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08111156115fd578686826040517fad4aac7600000000000000000000000000000000000000000000000000000000815260040161069a9392919061226a565b8260ff16601b1415801561161557508260ff16601c14155b15611652578686846040517fe578897e00000000000000000000000000000000000000000000000000000000815260040161069a9392919061228e565b600184036116bf576040805160008152602081018083528a905260ff851691810191909152606081018390526080810182905260019060a0015b6020604051602081039080840390855afa1580156116ae573d6000803e3d6000fd5b505050602060405103519450611797565b6002840361175c576040517f19457468657265756d205369676e6564204d6573736167653a0a3332000000006020820152603c8101899052600190605c01604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181528282528051602091820120600084529083018083525260ff861690820152606081018490526080810183905260a00161168c565b86868560016040517f9dfba85200000000000000000000000000000000000000000000000000000000815260040161069a94939291906122b5565b73ffffffffffffffffffffffffffffffffffffffff85166117e85786866040517f6c1719d200000000000000000000000000000000000000000000000000000000815260040161069a92919061223f565b505050509392505050565b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f60405160405180910390a3801561187c5773ffffffffffffffffffffffffffffffffffffffff821660009081526020819052604090204390555b505050565b6000808383611891600182612253565b8181106118a0576118a0611fe2565b919091013560f81c91505060018114806118ba5750600281145b156118ff578473ffffffffffffffffffffffffffffffffffffffff166118e1878686611530565b73ffffffffffffffffffffffffffffffffffffffff16149150611a25565b600381036119ea5773ffffffffffffffffffffffffffffffffffffffff8516631626ba7e8786600087611933600182612253565b926119409392919061214a565b6040518463ffffffff1660e01b815260040161195e939291906122e1565b602060405180830381865afa15801561197b573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061199f9190612304565b7fffffffff00000000000000000000000000000000000000000000000000000000167f1626ba7e00000000000000000000000000000000000000000000000000000000149150611a25565b83838260006040517f9dfba85200000000000000000000000000000000000000000000000000000000815260040161069a94939291906122b5565b50949350505050565b600080611a4960016c01000000000000000000000000612253565b606084901c94931692915050565b600060208284031215611a6957600080fd5b5035919050565b803573ffffffffffffffffffffffffffffffffffffffff81168114611a9457600080fd5b919050565b600060208284031215611aab57600080fd5b611ab482611a70565b9392505050565b80358015158114611a9457600080fd5b600080600080600060808688031215611ae357600080fd5b611aec86611a70565b945060208601359350604086013567ffffffffffffffff80821115611b1057600080fd5b818801915088601f830112611b2457600080fd5b813581811115611b3357600080fd5b8960208260061b8501011115611b4857600080fd5b602083019550809450505050611b6060608701611abb565b90509295509295909350565b60008060008060008060a08789031215611b8557600080fd5b611b8e87611a70565b95506020870135945060408701359350606087013567ffffffffffffffff80821115611bb957600080fd5b818901915089601f830112611bcd57600080fd5b813581811115611bdc57600080fd5b8a6020828501011115611bee57600080fd5b602083019550809450505050611c0660808801611abb565b90509295509295509295565b60008060408385031215611c2557600080fd5b611c2e83611a70565b946020939093013593505050565b60005b83811015611c57578181015183820152602001611c3f565b83811115611c66576000848401525b50505050565b60008151808452611c84816020860160208601611c3c565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b602081526000611ab46020830184611c6c565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b60405160c0810167ffffffffffffffff81118282101715611d1b57611d1b611cc9565b60405290565b604051601f82017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016810167ffffffffffffffff81118282101715611d6857611d68611cc9565b604052919050565b60006020808385031215611d8357600080fd5b823567ffffffffffffffff80821115611d9b57600080fd5b818501915085601f830112611daf57600080fd5b813581811115611dc157611dc1611cc9565b8060051b611dd0858201611d21565b9182528381018501918581019089841115611dea57600080fd5b86860192505b83831015611f1d57823585811115611e085760008081fd5b860160c07fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0828d038101821315611e3f5760008081fd5b611e47611cf8565b611e528b8501611abb565b81526040611e61818601611abb565b8c830152606080860135828401526080611e7c818801611a70565b8285015260a091508187013581850152508486013594508a851115611ea15760008081fd5b84860195508f603f870112611eb857600094508485fd5b8c86013594508a851115611ece57611ece611cc9565b611ede8d85601f88011601611d21565b93508484528f82868801011115611ef55760008081fd5b848287018e86013760009484018d019490945250918201528352509186019190860190611df0565b9998505050505050505050565b604080825283519082018190526000906020906060840190828701845b82811015611f65578151151584529284019290840190600101611f47565b50505083810382850152845180825282820190600581901b8301840187850160005b83811015611fd3577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0868403018552611fc1838351611c6c565b94870194925090860190600101611f87565b50909998505050505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff820361207157612071612011565b5060010190565b6000825161208a818460208701611c3c565b9190910192915050565b6000602082840312156120a657600080fd5b5051919050565b6020808252818101839052600090604080840186845b87811015612104578135835273ffffffffffffffffffffffffffffffffffffffff6120ef868401611a70565b168386015291830191908301906001016120c3565b5090979650505050505050565b82815260406020820152600061212a6040830184611c6c565b949350505050565b6000821982111561214557612145612011565b500190565b6000808585111561215a57600080fd5b8386111561216757600080fd5b5050820193919092039150565b602080825282518282018190526000919060409081850190868401855b828110156121cc5781518051855286015173ffffffffffffffffffffffffffffffffffffffff16868501529284019290850190600101612191565b5091979650505050505050565b61ffff8316815260406020820152600061212a6040830184611c6c565b8183528181602085013750600060208284010152600060207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f840116840101905092915050565b60208152600061212a6020830184866121f6565b60008282101561226557612265612011565b500390565b60408152600061227e6040830185876121f6565b9050826020830152949350505050565b6040815260006122a26040830185876121f6565b905060ff83166020830152949350505050565b6060815260006122c96060830186886121f6565b60208301949094525090151560409091015292915050565b8381526040602082015260006122fb6040830184866121f6565b95945050505050565b60006020828403121561231657600080fd5b81517fffffffff0000000000000000000000000000000000000000000000000000000081168114611ab457600080fdfea26469706673582212209e74238d04c330552593b29cbde14ac432f714144c662a6708e58318d378126464736f6c634300080e0033603a600e3d39601a805130553df3363d3d373d3d3d363d30545af43d82803e903d91601857fd5bf3";
var SequenceUtils__factory = /** @class */ (function (_super) {
    __extends(SequenceUtils__factory, _super);
    function SequenceUtils__factory() {
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
    SequenceUtils__factory.prototype.deploy = function (_factory, _mainModule, overrides) {
        return _super.prototype.deploy.call(this, _factory, _mainModule, overrides || {});
    };
    SequenceUtils__factory.prototype.getDeployTransaction = function (_factory, _mainModule, overrides) {
        return _super.prototype.getDeployTransaction.call(this, _factory, _mainModule, overrides || {});
    };
    SequenceUtils__factory.prototype.attach = function (address) {
        return _super.prototype.attach.call(this, address);
    };
    SequenceUtils__factory.prototype.connect = function (signer) {
        return _super.prototype.connect.call(this, signer);
    };
    SequenceUtils__factory.createInterface = function () {
        return new ethers_1.utils.Interface(_abi);
    };
    SequenceUtils__factory.connect = function (address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    };
    SequenceUtils__factory.bytecode = _bytecode;
    SequenceUtils__factory.abi = _abi;
    return SequenceUtils__factory;
}(ethers_1.ContractFactory));
exports.SequenceUtils__factory = SequenceUtils__factory;

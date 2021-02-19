/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { RequireUtils } from "../RequireUtils";

export class RequireUtils__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _factory: string,
    _mainModule: string,
    overrides?: Overrides
  ): Promise<RequireUtils> {
    return super.deploy(
      _factory,
      _mainModule,
      overrides || {}
    ) as Promise<RequireUtils>;
  }
  getDeployTransaction(
    _factory: string,
    _mainModule: string,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(_factory, _mainModule, overrides || {});
  }
  attach(address: string): RequireUtils {
    return super.attach(address) as RequireUtils;
  }
  connect(signer: Signer): RequireUtils__factory {
    return super.connect(signer) as RequireUtils__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): RequireUtils {
    return new Contract(address, _abi, signerOrProvider) as RequireUtils;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_factory",
        type: "address",
      },
      {
        internalType: "address",
        name: "_mainModule",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_wallet",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "_imageHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_threshold",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "_signers",
        type: "bytes",
      },
    ],
    name: "RequiredConfig",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_wallet",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_signer",
        type: "address",
      },
    ],
    name: "RequiredSigner",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "lastSignerUpdate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "lastWalletUpdate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_wallet",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_threshold",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "signer",
            type: "address",
          },
        ],
        internalType: "struct RequireUtils.Member[]",
        name: "_members",
        type: "tuple[]",
      },
      {
        internalType: "bool",
        name: "_index",
        type: "bool",
      },
    ],
    name: "publishConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_wallet",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_hash",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_sizeMembers",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes",
      },
      {
        internalType: "bool",
        name: "_index",
        type: "bool",
      },
    ],
    name: "publishInitialSigners",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_wallet",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_nonce",
        type: "uint256",
      },
    ],
    name: "requireMinNonce",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_expiration",
        type: "uint256",
      },
    ],
    name: "requireNonExpired",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x60c06040523480156200001157600080fd5b5060405162001af938038062001af98339810160408190526200003491620000bb565b606082811b6001600160601b03191660a052604080519182019052602880825262001ad16020830139816001600160a01b03166040516020016200007a929190620000f2565b60408051601f19818403018152919052805160209091012060805250620001349050565b80516001600160a01b0381168114620000b657600080fd5b919050565b60008060408385031215620000ce578182fd5b620000d9836200009e565b9150620000e9602084016200009e565b90509250929050565b60008351815b81811015620001145760208187018101518583015201620000f8565b81811115620001235782828501525b509190910191825250602001919050565b60805160a05160601c61196c6200016560003980610314528061076b525080610338528061078f525061196c6000f3fe608060405234801561001057600080fd5b50600436106100725760003560e01c80637f29d538116100505780637f29d538146100c8578063b472f0a2146100db578063e717aba9146100ee57610072565b80631cd05dc41461007757806344d466c2146100a05780637082503b146100b5575b600080fd5b61008a610085366004611015565b610101565b604051610097919061172f565b60405180910390f35b6100b36100ae366004611149565b610113565b005b6100b36100c3366004611036565b61048d565b6100b36100d63660046111f1565b6108e5565b6100b36100e9366004611120565b610921565b61008a6100fc366004611015565b6109ff565b60006020819052908152604090205481565b8360005b838110156101ac578185858381811061012c57fe5b9050604002016000013586868481811061014257fe5b905060400201602001602081019061015a9190611015565b60405160200161016c9392919061142c565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe081840301815291905280516020909101209150600101610117565b506000808773ffffffffffffffffffffffffffffffffffffffff166351605d8060e01b6040516020016101df91906112b7565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe081840301815290829052610217916112e4565b6000604051808303816000865af19150503d8060008114610254576040519150601f19603f3d011682016040523d82523d6000602084013e610259565b606091505b509150915081801561026c575080516020145b156102d15760008180602001905181019061028791906111d9565b90508381146102cb576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102c29061164f565b60405180910390fd5b506103c6565b60405173ffffffffffffffffffffffffffffffffffffffff891690610360907fff00000000000000000000000000000000000000000000000000000000000000907f00000000000000000000000000000000000000000000000000000000000000009087907f000000000000000000000000000000000000000000000000000000000000000090602001611253565b6040516020818303038152906040528051906020012060001c73ffffffffffffffffffffffffffffffffffffffff16146103c6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102c2906116ac565b828873ffffffffffffffffffffffffffffffffffffffff167fb502b7446ca079086188acf3abef47c2f464f2ee9a72fcdf05ffcb74dcc17cee898989604051602001610413929190611363565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529082905261044c9291611738565b60405180910390a383156104835773ffffffffffffffffffffffffffffffffffffffff881660009081526001602052604090204390555b5050505050505050565b60008061049984610a11565b915091506000804690508089896040516020016104b893929190611300565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0818403018152919052805160209091012091505061ffff831660008767ffffffffffffffff8111801561050f57600080fd5b5060405190808252806020026020018201604052801561054957816020015b610536610fc5565b81526020019060019003908161052e5790505b50905060005b87518510156106ef57600080806105668b89610a7f565b995060ff9182169450169150600183141561058e576105858b89610af9565b98509050610670565b8261063e57606061059f8c8a610b6d565b995090506105ad8882610c15565b91508173ffffffffffffffffffffffffffffffffffffffff168f73ffffffffffffffffffffffffffffffffffffffff167f600ba597427f042bcd559a0d06fa1732cc104d6dd43cbe8845b5a0e804b2b39f60405160405180910390a38a156106385773ffffffffffffffffffffffffffffffffffffffff821660009081526020819052604090204390555b50610670565b6040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102c290611458565b60405180604001604052808381526020018273ffffffffffffffffffffffffffffffffffffffff168152508585815181106106a757fe5b602002602001018190525083806001019450508582826040516020016106cf9392919061142c565b60405160208183030381529060405280519060200120955050505061054f565b888114610728576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102c2906115f2565b60405173ffffffffffffffffffffffffffffffffffffffff8c16906107b7907fff00000000000000000000000000000000000000000000000000000000000000907f00000000000000000000000000000000000000000000000000000000000000009087907f000000000000000000000000000000000000000000000000000000000000000090602001611253565b6040516020818303038152906040528051906020012060001c73ffffffffffffffffffffffffffffffffffffffff161461081d576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102c29061156f565b828b73ffffffffffffffffffffffffffffffffffffffff167fb502b7446ca079086188acf3abef47c2f464f2ee9a72fcdf05ffcb74dcc17cee888560405160200161086891906113c7565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0818403018152908290526108a1929161170a565b60405180910390a386156108d85773ffffffffffffffffffffffffffffffffffffffff8b1660009081526001602052604090204390555b5050505050505050505050565b80421061091e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102c290611512565b50565b60008061092d83610f44565b9150915060008473ffffffffffffffffffffffffffffffffffffffff16638c3f5563846040518263ffffffff1660e01b815260040161096c919061172f565b60206040518083038186803b15801561098457600080fd5b505afa158015610998573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109bc91906111d9565b9050818110156109f8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102c2906114b5565b5050505050565b60016020526000908152604090205481565b6020810151815160f09190911c90600290811115610a7a576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260278152602001806117e26027913960400191505060405180910390fd5b915091565b80820160200151825160f882901c9160f01c60ff16906002840190811115610af2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260268152602001806118d56026913960400191505060405180910390fd5b9250925092565b80820160200151825160609190911c906014830190811115610b66576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260238152602001806117bf6023913960400191505060405180910390fd5b9250929050565b6040805160428082526080820190925260609160009190602082018180368337019050509150828401602001805160208401526020810151604084015260228101516042840152506042830190508351811115610b66576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260238152602001806118766023913960400191505060405180910390fd5b60008082600184510381518110610c2857fe5b602001015160f81c60f81b60f81c60ff169050600083604081518110610c4a57fe5b016020015160f81c90506000610c608582610f5d565b90506000610c6f866020610f5d565b90507f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0811115610cea576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603d815260200180611782603d913960400191505060405180910390fd5b8260ff16601b14158015610d0257508260ff16601c14155b15610d58576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603d815260200180611809603d913960400191505060405180910390fd5b6001841415610dcc5760018784848460405160008152602001604052604051808581526020018460ff1681526020018381526020018281526020019450505050506020604051602081039080840390855afa158015610dbb573d6000803e3d6000fd5b505050602060405103519450610ece565b6002841415610e7d5760018760405160200180807f19457468657265756d205369676e6564204d6573736167653a0a333200000000815250601c018281526020019150506040516020818303038152906040528051906020012084848460405160008152602001604052604051808581526020018460ff1681526020018381526020018281526020019450505050506020604051602081039080840390855afa158015610dbb573d6000803e3d6000fd5b6040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603c815260200180611899603c913960400191505060405180910390fd5b73ffffffffffffffffffffffffffffffffffffffff8516610f3a576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260308152602001806118466030913960400191505060405180910390fd5b5050505092915050565b606081901c916bffffffffffffffffffffffff90911690565b60008160200183511015610fbc576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603c8152602001806118fb603c913960400191505060405180910390fd5b50016020015190565b604080518082019091526000808252602082015290565b803573ffffffffffffffffffffffffffffffffffffffff8116811461100057600080fd5b919050565b8035801515811461100057600080fd5b600060208284031215611026578081fd5b61102f82610fdc565b9392505050565b600080600080600060a0868803121561104d578081fd5b61105686610fdc565b9450602080870135945060408701359350606087013567ffffffffffffffff80821115611081578384fd5b818901915089601f830112611094578384fd5b8135818111156110a057fe5b604051847fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f84011682010181811084821117156110db57fe5b60405281815283820185018c10156110f1578586fd5b818585018683013785858383010152809650505050505061111460808701611005565b90509295509295909350565b60008060408385031215611132578182fd5b61113b83610fdc565b946020939093013593505050565b600080600080600060808688031215611160578081fd5b61116986610fdc565b945060208601359350604086013567ffffffffffffffff8082111561118c578283fd5b818801915088601f83011261119f578283fd5b8135818111156111ad578384fd5b8960206040830285010111156111c1578384fd5b60208301955080945050505061111460608701611005565b6000602082840312156111ea578081fd5b5051919050565b600060208284031215611202578081fd5b5035919050565b60008151808452611221816020860160208601611751565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b7fff0000000000000000000000000000000000000000000000000000000000000094909416845260609290921b7fffffffffffffffffffffffffffffffffffffffff0000000000000000000000001660018401526015830152603582015260550190565b7fffffffff0000000000000000000000000000000000000000000000000000000091909116815260040190565b600082516112f6818460208701611751565b9190910192915050565b7f19010000000000000000000000000000000000000000000000000000000000008152600281019390935260609190911b7fffffffffffffffffffffffffffffffffffffffff000000000000000000000000166022830152603682015260560190565b6020808252818101839052600090604080840186845b878110156113ba578135835273ffffffffffffffffffffffffffffffffffffffff6113a5868401610fdc565b16838601529183019190830190600101611379565b5090979650505050505050565b602080825282518282018190526000919060409081850190868401855b8281101561141f5781518051855286015173ffffffffffffffffffffffffffffffffffffffff168685015292840192908501906001016113e4565b5091979650505050505050565b928352602083019190915273ffffffffffffffffffffffffffffffffffffffff16604082015260600190565b6020808252603a908201527f526571756972655574696c73237075626c697368496e697469616c5369676e6560408201527f72733a20494e56414c49445f5349474e41545552455f464c4147000000000000606082015260800190565b60208082526032908201527f526571756972655574696c7323726571756972654d696e4e6f6e63653a204e4f60408201527f4e43455f42454c4f575f52455155495245440000000000000000000000000000606082015260800190565b60208082526027908201527f526571756972655574696c7323726571756972654e6f6e457870697265643a2060408201527f4558504952454400000000000000000000000000000000000000000000000000606082015260800190565b60208082526048908201527f526571756972655574696c73237075626c697368496e697469616c5369676e6560408201527f72733a20554e45585045435445445f434f554e5445524641435455414c5f494d60608201527f4147455f48415348000000000000000000000000000000000000000000000000608082015260a00190565b60208082526039908201527f526571756972655574696c73237075626c697368496e697469616c5369676e6560408201527f72733a20494e56414c49445f4d454d424552535f434f554e5400000000000000606082015260800190565b60208082526031908201527f526571756972655574696c73237075626c697368436f6e6669673a20554e455860408201527f5045435445445f494d4147455f48415348000000000000000000000000000000606082015260800190565b602080825260409082018190527f526571756972655574696c73237075626c697368436f6e6669673a20554e4558908201527f5045435445445f434f554e5445524641435455414c5f494d4147455f48415348606082015260800190565b600061ffff84168252604060208301526117276040830184611209565b949350505050565b90815260200190565b6000838252604060208301526117276040830184611209565b60005b8381101561176c578181015183820152602001611754565b8381111561177b576000848401525b5050505056fe5369676e617475726556616c696461746f72237265636f7665725369676e65723a20696e76616c6964207369676e6174757265202773272076616c75654c696242797465732372656164416464726573733a204f55545f4f465f424f554e44534c696242797465732372656164466972737455696e7431363a204f55545f4f465f424f554e44535369676e617475726556616c696461746f72237265636f7665725369676e65723a20696e76616c6964207369676e6174757265202776272076616c75655369676e617475726556616c696461746f72237265636f7665725369676e65723a20494e56414c49445f5349474e45524c696242797465732372656164427974657336363a204f55545f4f465f424f554e44535369676e617475726556616c696461746f72237265636f7665725369676e65723a20554e535550504f525445445f5349474e41545552455f545950454c69624279746573237265616455696e743855696e74383a204f55545f4f465f424f554e44534c696242797465732372656164427974657333323a20475245415445525f4f525f455155414c5f544f5f33325f4c454e4754485f5245515549524544a264697066735822122090a9ab0ba8e6bafd1ca5d2fd488993f5f3b1b3e622322ce6d0b8b480a309d2ce64736f6c63430007060033603a600e3d39601a805130553df3363d3d373d3d3d363d30545af43d82803e903d91601857fd5bf3";

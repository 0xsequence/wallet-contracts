pragma solidity ^0.5.0;

import "../Factory.sol";


contract WalletFactory {
    // Compiled from Wallet.sol
    bytes private constant WALLET_CODE = hex"60806040526040516101c13803806101c18339818101604052602081101561002657600080fd5b5051600080546001600160a01b039092166001600160a01b0319909216919091179055610169806100586000396000f3fe60806040908152600080356001600160e01b0319168152600160205220546001600160a01b03168061003957506000546001600160a01b03165b60006060826001600160a01b03166000366040518083838082843760405192019450600093509091505080830381855af49150503d8060008114610099576040519150601f19603f3d011682016040523d82523d6000602084013e61009e565b606091505b509150915081819061012e5760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b838110156100f35781810151838201526020016100db565b50505050905090810190601f1680156101205780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5050505000fea265627a7a72315820f7a7626604e37d656e984453496201cc8e5698ab183bf51c490df7c73f2e1cce64736f6c63430005100032";

    Factory public factory;
    address public main;

    constructor(Factory _factory, address _main) public {
        factory = _factory;
        main = _main;
    }

    function deploy(address _owner) external returns (address) {
        bytes32 salt = bytes32(uint256(_owner));
        bytes memory code = abi.encodePacked(WALLET_CODE, uint256(main));
        return factory.deploy(code, salt);
    }

    function addressOf(address _owner) external view returns (address) {
        bytes memory code = abi.encodePacked(WALLET_CODE, uint256(main));

        return address(
            uint256(
                keccak256(
                    abi.encodePacked(
                        bytes1(0xff),
                        factory,
                        uint256(_owner),
                        keccak256(code)
                    )
                )
            )
        );
    }
}

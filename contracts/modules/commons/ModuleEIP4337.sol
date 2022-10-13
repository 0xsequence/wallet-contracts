// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.17;
pragma experimental ABIEncoderV2;

import "./ModuleSelfAuth.sol";
import "./ModuleAuth.sol";
import "./ModuleNonce.sol";


abstract contract ModuleEIP4337 is ModuleSelfAuth, ModuleAuth, ModuleNonce {
  address public immutable eip4337Entrypoint;

  error EIP4337NotEntrypoint(address _caller);
  error EIP4337InvalidSignature(bytes32 _requestId, bytes _signature);

  constructor(address _entrypoint) {
    eip4337Entrypoint = _entrypoint;
  }

  modifier onlyEntrypoint() {
    if (msg.sender != eip4337Entrypoint) {
      revert EIP4337NotEntrypoint(msg.sender);
    }
    _;
  }

  struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
  }

  function validateUserOp(
    UserOperation calldata _userOp,
    bytes32 _requestId,
    uint256 _requiredPrefund
  ) external onlyEntrypoint {
    if (isValidSignature(_requestId, _userOp.signature) != SELECTOR_ERC1271_BYTES32_BYTES) {
      revert EIP4337InvalidSignature(_requestId, _userOp.signature);
    }

    _validateNonce(_userOp.nonce);

    if (_requiredPrefund != 0) {
      // solhint-disable-next-line
      payable(msg.sender).call{ value : _requiredPrefund }("");
    }
  }

  function isSelfAuth() internal override virtual view returns (bool) {
    bool parent = super.isSelfAuth();
    if (parent) return true;

    return msg.sender == eip4337Entrypoint;
  }
}

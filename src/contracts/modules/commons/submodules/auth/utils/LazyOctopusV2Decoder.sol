// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "../../../../../utils/LibBytes.sol";
import "../../../../../utils/SignatureValidator.sol";
import "../../../../../interfaces/IERC1271Wallet.sol";
import "../../../interfaces/IModuleAuth.sol";
import "../../../interfaces/IModuleCalls.sol";

import "../../nonce/SubModuleNonce.sol";


library LazyOctopusV2Decoder {
  //                       SESSION_SPACE = bytes32(uint256(uint160(bytes20(keccak256("org.sequence.sessions.space")))));
  //                                     = 0x96f7fef04d2478e2b011c3aca79dc5a83b5d37ef
  uint256 internal constant SESSION_SPACE = 861879107978547650890364157709704413515112855535;

  // Errors
  error InvalidTransaction(IModuleCalls.Transaction _tx);
  error InvalidNonceType(uint256 _type);
  error InvalidNonceSpace(uint256 _space);

  function decodeLazyOctopusV2Batch(IModuleCalls.Transaction memory _tx, uint256 _nonce, address _wallet) internal pure returns (bytes32 _imageHash, uint256 _gapNonce) {
    // Validate basic transaction structure
    if (
      _tx.delegateCall ||
      _tx.value != 0 ||
      _tx.revertOnError ||
      _tx.gasLimit != 0 ||
      _tx.data.length != 36 ||
      _tx.target != _wallet
    ) {
      revert InvalidTransaction(_tx);
    }

    // Validate gapNonce
    (uint256 space, uint256 nonceType, uint256 providedNonce) = SubModuleNonce.decodeNonce(_nonce);
    if (nonceType != SubModuleNonce.TypeGapNonce) {
      revert InvalidNonceType(nonceType);
    }

    if (space != SESSION_SPACE) {
      revert InvalidNonceSpace(space);
    }

    // Recover imageHash
    (bytes4 sig, bytes memory args) = LibBytes.splitSigAndArgs(_tx.data);
    if (sig != IModuleAuth.updateImageHash.selector) {
      revert InvalidTransaction(_tx);
    }

    _imageHash = abi.decode(args, (bytes32));
    _gapNonce = providedNonce;
  }
}

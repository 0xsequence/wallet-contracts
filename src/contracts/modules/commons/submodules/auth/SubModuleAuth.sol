// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "../../../../utils/LibBytes.sol";
import "../../../../utils/SignatureValidator.sol";
import "../../../../interfaces/IERC1271Wallet.sol";
import "../../interfaces/IModuleAuth.sol";


abstract contract SubModuleAuth is IModuleAuth, SignatureValidator {
  using LibBytes for bytes;

  uint256 private constant FLAG_SIGNATURE = 0;
  uint256 private constant FLAG_ADDRESS = 1;
  uint256 private constant FLAG_DYNAMIC_SIGNATURE = 2;

  function _recoverSignature(
    bytes32 _msgSubDigest,
    bytes calldata _signature,
    uint256 _rindex
  ) internal virtual view returns (
    bytes32 _imageHash,
    uint256 _weight,
    uint256 _thershold
  ) {
    unchecked {
      uint256 rindex = _rindex;
      (_thershold, rindex) = _signature.cReadUint16(rindex);

      // Start image hash generation
      _imageHash = bytes32(uint256(_thershold));

      // Iterate until the image is completed
      while (rindex < _signature.length) {
        // Read next item type and addrWeight
        uint256 flag; uint256 addrWeight; address addr;
        (flag, addrWeight, rindex) = _signature.cReadUint8Uint8(rindex);

        if (flag == FLAG_ADDRESS) {
          // Read plain address
          (addr, rindex) = _signature.cReadAddress(rindex);

        } else if (flag == FLAG_SIGNATURE) {
          // Read single signature and recover signer
          uint256 nrindex = rindex + 66;
          addr = recoverSigner(_msgSubDigest, _signature[rindex:nrindex]);
          rindex = nrindex;

          // Acumulate total weight of the signature
          _weight += addrWeight;
        } else if (flag == FLAG_DYNAMIC_SIGNATURE) {
          // Read signer
          (addr, rindex) = _signature.cReadAddress(rindex);
          // Read signature size
          uint256 size;
          (size, rindex) = _signature.cReadUint16(rindex);

          // Read dynamic size signature
          uint256 nrindex = rindex + size;
          if (!isValidSignature(_msgSubDigest, addr, _signature[rindex:nrindex])) {
            revert InvalidNestedSignature(_msgSubDigest, addr, _signature[rindex:nrindex]);
          }
          rindex = nrindex;

          // Acumulate total weight of the signature
          _weight += addrWeight;
        } else {
          revert InvalidSignatureFlag(flag);
        }

        // Write weight and address to image
        _imageHash = keccak256(abi.encode(_imageHash, addrWeight, addr));
      }
    }
  }
}

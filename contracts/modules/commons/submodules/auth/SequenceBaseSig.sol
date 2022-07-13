pragma solidity 0.8.14;

import "../../../../utils/SignatureValidator.sol";
import "../../../../utils/LibBytes.sol";


library SequenceBaseSig {
  using LibBytes for bytes;
  
  uint256 private constant FLAG_SIGNATURE = 0;
  uint256 private constant FLAG_ADDRESS = 1;
  uint256 private constant FLAG_DYNAMIC_SIGNATURE = 2;

  error InvalidNestedSignature(bytes32 _hash, address _addr, bytes _signature);
  error InvalidSignatureFlag(uint256 _flag);

  function subDigest(
    bytes32 _digest
  ) internal view returns (bytes32) {
    return keccak256(
      abi.encodePacked(
        "\x19\x01",
        block.chainid,
        address(this),
        _digest
      )
    );
  }

  function recover(
    bytes32 _subDigest,
    bytes calldata _signature
  ) internal view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash
  ) {
    unchecked {
      uint256 rindex = 0;
      (threshold, rindex) = _signature.cReadUint16(rindex);

      // Start image hash generation
      imageHash = bytes32(uint256(threshold));

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
          addr = SignatureValidator.recoverSigner(_subDigest, _signature[rindex:nrindex]);
          rindex = nrindex;

          // Acumulate total weight of the signature
          weight += addrWeight;
        } else if (flag == FLAG_DYNAMIC_SIGNATURE) {
          // Read signer
          (addr, rindex) = _signature.cReadAddress(rindex);
          // Read signature size
          uint256 size;
          (size, rindex) = _signature.cReadUint16(rindex);

          // Read dynamic size signature
          uint256 nrindex = rindex + size;
          if (!SignatureValidator.isValidSignature(_subDigest, addr, _signature[rindex:nrindex])) {
            revert InvalidNestedSignature(_subDigest, addr, _signature[rindex:nrindex]);
          }
          rindex = nrindex;

          // Acumulate total weight of the signature
          weight += addrWeight;
        } else {
          revert InvalidSignatureFlag(flag);
        }

        // Write weight and address to image
        imageHash = keccak256(abi.encode(imageHash, addrWeight, addr));
      }
    }
  }
}

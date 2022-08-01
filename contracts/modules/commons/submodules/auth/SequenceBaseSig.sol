// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "../../../../utils/SignatureValidator.sol";
import "../../../../utils/LibBytesPointer.sol";
import "../../../../utils/LibBytes.sol";
import "../../../../utils/LibOptim.sol";


library SequenceBaseSig {
  using LibBytesPointer for bytes;
  
  uint256 private constant FLAG_SIGNATURE = 0;
  uint256 private constant FLAG_ADDRESS = 1;
  uint256 private constant FLAG_DYNAMIC_SIGNATURE = 2;
  uint256 private constant FLAG_NODE = 3;
  uint256 private constant FLAG_BRANCH = 4;

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

  function _joinAddrAndWeight(
    address _addr,
    uint256 _weight
  ) internal pure returns (bytes32) {
    return bytes32(uint256(uint160(_addr))) | bytes32((uint256(_weight) << 160));
  }

  function recoverBranch(
    bytes32 _subDigest,
    bytes calldata _signature
  ) internal view returns (
    uint256 weight,
    bytes32 root
  ) {
    unchecked {
      uint256 rindex;

      // Iterate until the image is completed
      while (rindex < _signature.length) {
        // Read next item type and addrWeight
        uint256 flag; uint256 addrWeight; address addr;
        (flag, addrWeight, rindex) = _signature.readUint8Uint8(rindex);

        if (flag == FLAG_ADDRESS) {
          // Read plain address
          (addr, rindex) = _signature.readAddress(rindex);

          // Write weight and address to image
          bytes32 node = _joinAddrAndWeight(addr, addrWeight);
          root = root != bytes32(0) ? LibOptim.fkeccak256(root, node) : node;
          continue;
        }

        if (flag == FLAG_SIGNATURE) {
          // Read single signature and recover signer
          uint256 nrindex = rindex + 66;
          addr = SignatureValidator.recoverSigner(_subDigest, _signature[rindex:nrindex]);
          rindex = nrindex;

          // Acumulate total weight of the signature
          weight += addrWeight;

          // Write weight and address to image
          bytes32 node = _joinAddrAndWeight(addr, addrWeight);
          root = root != bytes32(0) ? LibOptim.fkeccak256(root, node) : node;
          continue;
        }

        if (flag == FLAG_DYNAMIC_SIGNATURE) {
          // Read signer
          (addr, rindex) = _signature.readAddress(rindex);
          // Read signature size
          uint256 size;
          (size, rindex) = _signature.readUint16(rindex);

          // Read dynamic size signature
          uint256 nrindex = rindex + size;
          if (!SignatureValidator.isValidSignature(_subDigest, addr, _signature[rindex:nrindex])) {
            revert InvalidNestedSignature(_subDigest, addr, _signature[rindex:nrindex]);
          }
          rindex = nrindex;

          // Acumulate total weight of the signature
          weight += addrWeight;

          // Write weight and address to image
          bytes32 node = _joinAddrAndWeight(addr, addrWeight);
          root = root != bytes32(0) ? LibOptim.fkeccak256(root, node) : node;
          continue;
        }

        if (flag == FLAG_NODE) {
          // Nodes don't have weights, so we need to push the pointer
          // back by 1 byte, and ignore the weight.
          rindex--;

          // Read node hash
          bytes32 node;
          (node, rindex) = _signature.readBytes32(rindex);
          root = root != bytes32(0) ? LibOptim.fkeccak256(root, node) : node;
          continue;
        }

        if (flag == FLAG_BRANCH) {
          // Enter a branch of the signature merkle tree
          // we use recursion for this
          
          // We don't use the weight either
          // instead we read the size of the nested signature
          rindex--;

          uint256 size; bytes32 node;
          (size, rindex) = _signature.readUint16(rindex);
          uint256 nrindex = rindex + size;

          uint256 nweight;
          (nweight, node) = recoverBranch(_subDigest, _signature[rindex:nrindex]);

          weight += nweight;
          root = LibOptim.fkeccak256(root, node);

          rindex = nrindex;
          continue;
        }

        revert InvalidSignatureFlag(flag);
      }
    }
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
      (weight, imageHash) = recoverBranch(_subDigest, _signature[2:]);

      // Thershold is the top-most node (but first on the signature)
      (threshold) = LibBytes.readFirstUint16(_signature);
      imageHash = LibOptim.fkeccak256(imageHash, bytes32(threshold));
    }
  }
}

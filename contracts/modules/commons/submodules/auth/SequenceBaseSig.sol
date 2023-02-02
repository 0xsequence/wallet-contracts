// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

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
  uint256 private constant FLAG_SUBDIGEST = 5;
  uint256 private constant FLAG_NESTED = 6;

  error InvalidNestedSignature(bytes32 _hash, address _addr, bytes _signature);
  error InvalidSignatureFlag(uint256 _flag);

  function subdigest(
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

  function _leafForAddressAndWeight(
    address _addr,
    uint96 _weight
  ) internal pure returns (bytes32) {
    unchecked {
      return bytes32(uint256(_weight) << 160 | uint256(uint160(_addr)));
    }
  }

  function _leafForHardcodedSubdigest(
    bytes32 _subdigest
  ) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked('Sequence static digest:\n', _subdigest));
  }

  function _leafForNested(
    bytes32 _node,
    uint256 _threshold,
    uint256 _weight
  ) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked('Sequence nested config:\n', _node, _threshold, _weight));
  }

  function recoverBranch(
    bytes32 _subdigest,
    bytes calldata _signature
  ) internal view returns (
    uint256 weight,
    bytes32 root
  ) {
    unchecked {
      uint256 rindex;

      // Iterate until the image is completed
      while (rindex < _signature.length) {
        // Read next item type
        uint256 flag;
        (flag, rindex) = _signature.readUint8(rindex);

        if (flag == FLAG_ADDRESS) {
          // Read plain address
          uint8 addrWeight; address addr;
          (addrWeight, addr, rindex) = _signature.readUint8Address(rindex);

          // Write weight and address to image
          bytes32 node = _leafForAddressAndWeight(addr, addrWeight);
          root = root != bytes32(0) ? LibOptim.fkeccak256(root, node) : node;
          continue;
        }

        if (flag == FLAG_SIGNATURE) {
          // Read weight
          uint8 addrWeight;
          (addrWeight, rindex) = _signature.readUint8(rindex);

          // Read single signature and recover signer
          uint256 nrindex = rindex + 66;
          address addr = SignatureValidator.recoverSigner(_subdigest, _signature[rindex:nrindex]);
          rindex = nrindex;

          // Acumulate total weight of the signature
          weight += addrWeight;

          // Write weight and address to image
          bytes32 node = _leafForAddressAndWeight(addr, addrWeight);
          root = root != bytes32(0) ? LibOptim.fkeccak256(root, node) : node;
          continue;
        }

        if (flag == FLAG_DYNAMIC_SIGNATURE) {
          // Read signer and weight
          uint8 addrWeight; address addr;
          (addrWeight, addr, rindex) = _signature.readUint8Address(rindex);

          // Read signature size
          uint256 size;
          (size, rindex) = _signature.readUint24(rindex);

          // Read dynamic size signature
          uint256 nrindex = rindex + size;
          if (!SignatureValidator.isValidSignature(_subdigest, addr, _signature[rindex:nrindex])) {
            revert InvalidNestedSignature(_subdigest, addr, _signature[rindex:nrindex]);
          }
          rindex = nrindex;

          // Acumulate total weight of the signature
          weight += addrWeight;

          // Write weight and address to image
          bytes32 node = _leafForAddressAndWeight(addr, addrWeight);
          root = root != bytes32(0) ? LibOptim.fkeccak256(root, node) : node;
          continue;
        }

        if (flag == FLAG_NODE) {
          // Read node hash
          bytes32 node;
          (node, rindex) = _signature.readBytes32(rindex);
          root = root != bytes32(0) ? LibOptim.fkeccak256(root, node) : node;
          continue;
        }

        if (flag == FLAG_BRANCH) {
          // Enter a branch of the signature merkle tree
          uint256 size;
          (size, rindex) = _signature.readUint24(rindex);
          uint256 nrindex = rindex + size;

          uint256 nweight; bytes32 node;
          (nweight, node) = recoverBranch(_subdigest, _signature[rindex:nrindex]);

          weight += nweight;
          root = LibOptim.fkeccak256(root, node);

          rindex = nrindex;
          continue;
        }

        if (flag == FLAG_NESTED) {
          // Enter a branch of the signature merkle tree
          // but with an internal threshold and an external fixed weight
          uint256 externalWeight;
          (externalWeight, rindex) = _signature.readUint8(rindex);

          uint256 internalThreshold;
          (internalThreshold, rindex) = _signature.readUint16(rindex);

          uint256 size;
          (size, rindex) = _signature.readUint24(rindex);
          uint256 nrindex = rindex + size;

          uint256 internalWeight; bytes32 internalRoot;
          (internalWeight, internalRoot) = recoverBranch(_subdigest, _signature[rindex:nrindex]);
          rindex = nrindex;

          if (internalWeight >= internalThreshold) {
            weight += externalWeight;
          }

          bytes32 node = _leafForNested(internalRoot, internalThreshold, externalWeight);
          root = root != bytes32(0) ? LibOptim.fkeccak256(root, node) : node;

          continue;
        }

        if (flag == FLAG_SUBDIGEST) {
          // A hardcoded always accepted digest
          // it pushes the weight to the maximum
          bytes32 hardcoded;
          (hardcoded, rindex) = _signature.readBytes32(rindex);
          if (hardcoded == _subdigest) {
            weight = type(uint256).max;
          }

          bytes32 node = _leafForHardcodedSubdigest(hardcoded);
          root = root != bytes32(0) ? LibOptim.fkeccak256(root, node) : node;
          continue;
        }

        revert InvalidSignatureFlag(flag);
      }
    }
  }

  function recover(
    bytes32 _subdigest,
    bytes calldata _signature
  ) internal view returns (
    uint256 threshold,
    uint256 weight,
    bytes32 imageHash,
    uint256 checkpoint
  ) {
    unchecked {
      (weight, imageHash) = recoverBranch(_subdigest, _signature[6:]);

      // Threshold & checkpoint are the top nodes
      // (but they are first on the signature)
      threshold = LibBytes.readFirstUint16(_signature);
      checkpoint = LibBytes.readUint32(_signature, 2);

      imageHash = LibOptim.fkeccak256(imageHash, bytes32(threshold));
      imageHash = LibOptim.fkeccak256(imageHash, bytes32(checkpoint));
    }
  }
}

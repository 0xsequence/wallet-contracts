pragma solidity 0.8.14;

import "../../../../utils/SignatureValidator.sol";
import "../../../../utils/LibBytesPointer.sol";

import "hardhat/console.sol";


library SequenceBaseSig {
  using LibBytesPointer for bytes;
  
  uint256 private constant FLAG_SIGNATURE = 3;
  uint256 private constant FLAG_ADDRESS = 1;
  uint256 private constant FLAG_DYNAMIC_SIGNATURE = 2;
  uint256 private constant FLAG_EMPTY_LEAF = 0;

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
    return bytes32(uint256(uint160(_addr))) | bytes32(_weight << 160);
  }

  function _recoverToWorkspace(
    bytes32 _subDigest,
    bytes calldata _signature,
    bytes32[] memory _workspace,
    uint256 _parts,
    uint256 _index
  ) internal view returns (
    uint256 weight,
    uint256 rindex
  ) {
    unchecked {
      rindex = _index;

      // Recover signature
      for (uint256 i = 0; i < _parts; ++i) {
        // Read next item type and addrWeight
        uint256 flag;
        (flag, rindex) = _signature.readUint8(rindex);

        if (flag == FLAG_EMPTY_LEAF) {
          continue;
        }

        // Read address weight
        uint256 addrWeight;
        (addrWeight, rindex) = _signature.readUint8(rindex);

        if (flag == FLAG_ADDRESS) {
          // Read plain address
          address addr;
          (addr, rindex) = _signature.readAddress(rindex);
          _workspace[i] = _joinAddrAndWeight(addr, addrWeight);
          continue;

        }
        
        if (flag == FLAG_SIGNATURE) {
          // Read single signature and recover signer
          uint256 nrindex = rindex + 66;

          address addr;
          addr = SignatureValidator.recoverSigner(_subDigest, _signature[rindex:nrindex]);
          _workspace[i] = _joinAddrAndWeight(addr, addrWeight);
          rindex = nrindex;
    
          // Acumulate total weight of the signature
          weight += addrWeight;
          continue;

        }
        
        if (flag == FLAG_DYNAMIC_SIGNATURE) {
          // Read signer
          address addr;
          (addr, rindex) = _signature.readAddress(rindex);
          _workspace[i] = _joinAddrAndWeight(addr, addrWeight);

          uint256 nrindex;

          {
            // Read signature size
            uint256 size;
            (size, rindex) = _signature.readUint16(rindex);

            // Read dynamic size signature
            nrindex = rindex + size;
          }

          if (!SignatureValidator.isValidSignature(_subDigest, addr, _signature[rindex:nrindex])) {
            revert InvalidNestedSignature(_subDigest, addr, _signature[rindex:nrindex]);
          }

          rindex = nrindex;

          // Acumulate total weight of the signature
          weight += addrWeight;
          continue;

        }

        revert InvalidSignatureFlag(flag);
      }
    }
  }

  function _computeMerkleRoot(
    bytes32[] memory _workspace,
    bytes calldata _witness,
    uint256 _nodes
  ) internal view returns (bytes32) {
    unchecked {
      uint256 rindex = 0;

      uint256 ni;
      for (uint256 i = _nodes; i > 1; i = ni) {
        ni = (i + 1) / 2;
        for (uint256 j = 0; j < ni; ++j) {
          uint256 nai = j * 2;
          uint256 nbi = nai + 1;

          bytes32 node_a = _workspace[nai];

          if (nbi >= i) {
            // Move node up
            _workspace[j] = node_a;
            continue;
          }

          bytes32 node_b = _workspace[j * 2 + 1];

          if ((node_a | node_b) == bytes32(0)) {
            _workspace[j] = bytes32(0);
            continue;
          }

          if (node_a == bytes32(0)) {
            (node_a, rindex) = _witness.readBytes32(rindex);
          } else if (node_b == bytes32(0)) {
            (node_b, rindex) = _witness.readBytes32(rindex);            
          }

          _workspace[j] = keccak256(abi.encode(node_a, node_b));
        }
      }

      return _workspace[0];
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
      uint256 rindex;
      (threshold, rindex) = _signature.readFirstUint16();

      uint256 leaves;
      (leaves, rindex) = _signature.readUint16(rindex);

      bytes32[] memory workspace = new bytes32[](leaves);

      // Recover signature
      (weight, rindex) = _recoverToWorkspace(_subDigest, _signature, workspace, leaves, rindex);

      // Construct merkle root
      bytes32 merkleRoot = _computeMerkleRoot(workspace, _signature[rindex:], leaves);

      // ImageHash is keccak256(threshold + merkle root)
      imageHash = keccak256(abi.encode(threshold, merkleRoot));
    }
  }
}

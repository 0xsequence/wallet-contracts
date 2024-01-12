// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "../commons/interfaces/IModuleCalls.sol";
import "../commons/submodules/nonce/SubModuleNonce.sol";
import "../commons/submodules/auth/SequenceBaseSig.sol";

import "../../utils/LibBytesPointer.sol";
import "../../utils/LibBytes.sol";

import "forge-std/console.sol";

function bytesToUint256(
  bytes memory _b
) pure returns (uint256 result) {
  assembly {
    // Load 32 bytes of data from the memory pointed to by _b
    result := mload(add(_b, 0x20))

    // Shift right to discard the extra bytes in case of shorter lengths
    let size := mload(_b)
    if lt(size, 32) {
      result := shr(mul(sub(32, size), 8), result)
    }
  }
}

function bytesToAddress(bytes memory _b) pure returns (address addr) {
  assembly {
    // Load 32 bytes from memory, but only use the last 20 bytes for the address
    addr := and(mload(add(_b, 0x14)), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
  }
}

contract L2SequenceDecompressor {
  using LibBytesPointer for bytes;

  // 128 bits for bytes32 and 128 bits for addresses
  uint256 private knownBytes32AndAddressesSizes;
  mapping(uint256 => bytes32) public knownBytes32s;
  mapping(uint256 => address) public knownAdresses;

  error UnknownFlag(uint256 _flag, uint256 _index);

  function numKnownBytes32() public view returns (uint256 _val, uint256 _word) {
    _word = knownBytes32AndAddressesSizes;
    _val = _word & 0xFFFFFFFFFFFFFFFF;
  }

  function numKnownAddresses() public view returns (uint256 _val, uint256 _word) {
    _word = knownBytes32AndAddressesSizes;
    _val = _word >> 128;
  }

  function setNumKnownBytes32(uint256 _val, uint256 _prev) internal {
    knownBytes32AndAddressesSizes = (_val & 0xFFFFFFFFFFFFFFFF) | (_prev & 0xFFFFFFFFFFFFFFFF0000000000000000);
  }

  function setNumKnownAddresses(uint256 _val, uint256 _prev) internal {
    knownBytes32AndAddressesSizes = (_val << 128) | (_prev & 0xFFFFFFFFFFFFFFFF);
  }

  function nextIndexBytes32() internal returns (uint256) {
    (uint256 index, uint256 word) = numKnownBytes32();
    setNumKnownBytes32(index + 1, word);
    return index;
  }

  function nextIndexAddress() internal returns (uint256) {
    (uint256 index, uint256 word) = numKnownAddresses();
    setNumKnownAddresses(index + 1, word);
    return index;
  }

  fallback() external {
    (
      address wallet,
      IModuleCalls.Transaction[] memory transactions,
      uint256 nonce,
      bytes memory signature,
    ) = decodeSequenceTransaction(0);

    bytes memory encoded = abi.encodeWithSelector(IModuleCalls.execute.selector, transactions, nonce, signature);
    (bool success,) = wallet.call(encoded);
    require(success, "L2SequenceCompressor: call failed");
  }

  function decodeSequenceTransaction(
    uint256 _pointer
  ) internal returns (
    address wallet,
    IModuleCalls.Transaction[] memory transactions,
    uint256 nonce,
    bytes memory signature,
    uint256 newPointer
  ) {
    unchecked {
      bytes memory data;

      // A Sequence transaction is composed of:
      // - a Signature
      // - a list of transactions
      // - a nonce
      // The order is always [wallet]:[ntransactions]:[transactions]:[nonce]:[signaturesize][signature]

      // Read wallet address, this is where we will send the call
      (data, newPointer) = readAdvanced(_pointer);
      wallet = bytesToAddress(data);

      // Read list of transactions
      (data, newPointer) = readAdvanced(newPointer);
      uint256 ntransactions = bytesToUint256(data);

      transactions = new IModuleCalls.Transaction[](ntransactions);

      for (uint256 i = 0; i < ntransactions; i++) {
        (transactions[i], newPointer) = readTransaction(wallet, newPointer);
      }

      // Read the nonce
      (nonce, newPointer) = readNonce(newPointer);

      // Read the signature
      (signature, newPointer) = readAllSignature(newPointer);
      // (signature, newPointer) = readAdvanced(newPointer);
    }
  }

  function readAllSignature(
    uint256 _pointer
  ) internal returns (
    bytes memory signature,
    uint256 newPointer
  ) {
    unchecked {
      uint8 flag;
      (flag, newPointer) = msg.data.readUint8(_pointer);

      // Doesn't have any special encoding
      // just read the signature as any set of bytes
      if (flag == 0x00) {
        return readAdvanced(newPointer);

      // Single signature with chain id
      } else if (flag == 0x01) {
        return readSignature(newPointer, false);

      // Chained signature
      } else if (flag == 0x02) {
        bytes memory data;
        (data, newPointer) = readAdvanced(newPointer);
        uint256 subparts = bytesToUint256(data);

        for (uint256 i = 0; i < subparts; i++) {
          (data, newPointer) = readAllSignature(newPointer);
          signature = abi.encodePacked(signature, uint24(data.length), data);
        }

        signature = abi.encodePacked(uint8(0x03), signature);
      }
    }
  }

  function readSignature(
    uint256 _pointer,
    bool _noChainId
  ) internal returns (
    bytes memory signature,
    uint256 newPointer
  ) {
    unchecked {
      bytes memory data;

      // Read the threshold first, use advanced as it may be 1 or 2 bytes
      (data, newPointer) = readAdvanced(_pointer);
      uint256 threshold = bytesToUint256(data);

      // Read the checkpoint, use advanced as it may have up to 4 bytes
      (data, newPointer) = readAdvanced(newPointer);
      uint256 checkpoint = bytesToUint256(data);

      // Read the tree
      (signature, newPointer) = readSignatureBranch(newPointer);

      // Build the signature, 0x01 type, 2 bytes for the threshold, 4 bytes for the checkpoint, the rest is the signature
      signature = abi.encodePacked(uint8(_noChainId ? 0x02 : 0x01), uint16(threshold), uint32(checkpoint), signature);
    }
  }

  function readSignatureBranch(
    uint256 _pointer
  ) internal returns (
    bytes memory signature,
    uint256 newPointer
  ) {
    bytes memory data;

    // Now load the number of "parts" that we will read after this
    (data, newPointer) = readAdvanced(_pointer);
    uint256 nparts = bytesToUint256(data);

    // Read part by part, concatenate them
    for (uint256 i = 0; i < nparts; i++) {
      (data, newPointer) = readAdvanced(newPointer);
      signature = abi.encodePacked(signature, data);
    }

    return (signature, newPointer);
  }

  function readNonce(
    uint256 _pointer
  ) internal returns (
    uint256 encodedNonce,
    uint256 newPointer
  ) {
    unchecked {
      bytes memory data;

      (data, newPointer) = readAdvanced(_pointer);
      uint256 space = bytesToUint256(data);

      (data, newPointer) = readAdvanced(newPointer);
      uint256 nonce = bytesToUint256(data);

      encodedNonce = SubModuleNonce.encodeNonce(space, nonce);
    }
  }

  function readTransaction(
    address _self,
    uint256 _pointer
  ) internal returns (
    IModuleCalls.Transaction memory transaction,
    uint256 newPointer
  ) {
    unchecked {
      uint256 miscflags;
      (miscflags, newPointer) = msg.data.readUint8(_pointer);

      transaction.delegateCall = (miscflags & 0x80) != 0;  // 1000 0000 for delegateCall
      transaction.revertOnError = (miscflags & 0x40) != 0; // 0100 0000 for revertOnError

      bool hasGasLimit = (miscflags & 0x20) != 0;          // 0010 0000 for gasLimit
      bool hasValue = (miscflags & 0x10) != 0;             // 0001 0000 for value
      bool hasData = (miscflags & 0x08) != 0;              // 0000 1000 for data
      bool selfTarget = (miscflags & 0x04) != 0;           // 0000 0100 for selfTarget
      // bool isNestedSequence = (miscflags & 0x02) != 0;     // 0000 0010 for nestedSequence

      bytes memory data;

      if (hasGasLimit) {
        (data, newPointer) = readAdvanced(newPointer);
        transaction.gasLimit = bytesToUint256(data);
      }

      if (hasValue) {
        (data, newPointer) = readAdvanced(newPointer);
        transaction.value = bytesToUint256(data);
      }

      if (hasData) {
        (data, newPointer) = readAdvanced(newPointer);
        transaction.data = data;
      }

      // bool isNestedSequence = (miscflags & 0x02) != 0;     // 0000 0010 for nestedSequence
      if ((miscflags & 0x02) != 0) {
        address wallet;
        IModuleCalls.Transaction[] memory transactions;
        uint256 nonce;
        bytes memory signature;

        (wallet, transactions, nonce, signature, newPointer) = decodeSequenceTransaction(newPointer); 
        transaction.data = abi.encodeWithSelector(IModuleCalls.execute.selector, transactions, nonce, signature);
        transaction.target = wallet;
      }

      if (selfTarget) {
        transaction.target = _self;
      } else {
        (data, newPointer) = readAdvanced(newPointer);
        transaction.target = bytesToAddress(data);
      }
    }
  }

  uint8 constant internal FLAG_READ_BYTES32_0_BYTES  = 0x00;
  uint8 constant internal FLAG_READ_BYTES32_32_BYTES = 0x20;
  uint8 constant internal FLAG_SAVE_ADDRESS          = 0x21;
  uint8 constant internal FLAG_SAVE_BYTES32          = 0x22;
  uint8 constant internal FLAG_READ_BYTES32_2_BYTES  = 0x23;
  uint8 constant internal FLAG_READ_BYTES32_5_BYTES  = 0x26;
  uint8 constant internal FLAG_READ_ADDRESS_2_BYTES  = 0x27;
  uint8 constant internal FLAG_READ_ADDRESS_3_BYTES  = 0x28;
  uint8 constant internal FLAG_READ_ADDRESS_4_BYTES  = 0x29;
  uint8 constant internal FLAG_READ_ADDRESS_5_BYTES  = 0x2a;
  uint8 constant internal FLAG_READ_N_BYTES          = 0x2f;
  uint8 constant internal FLAG_ABI_1_PARAM           = 0x30;
  uint8 constant internal FLAG_ABI_2_PARAMS          = 0x31;
  uint8 constant internal FLAG_ABI_3_PARAMS          = 0x32;
  uint8 constant internal FLAG_ABI_4_PARAMS          = 0x33;
  uint8 constant internal FLAG_ABI_5_PARAMS          = 0x34;
  uint8 constant internal FLAG_ABI_6_PARAMS          = 0x35;
  uint8 constant internal FLAG_SIGNATURE             = 0x36;
  uint8 constant internal FLAG_SIGNATURE_W1          = 0x37;
  uint8 constant internal FLAG_SIGNATURE_W2          = 0x38;
  uint8 constant internal FLAG_SIGNATURE_W3          = 0x39;
  uint8 constant internal FLAG_SIGNATURE_W4          = 0x3a;
  uint8 constant internal FLAG_ADDRESS               = 0x3b;
  uint8 constant internal FLAG_ADDRESS_W0            = 0x3c;
  uint8 constant internal FLAG_ADDRESS_W1            = 0x3d;
  uint8 constant internal FLAG_ADDRESS_W2            = 0x3e;
  uint8 constant internal FLAG_ADDRESS_W3            = 0x3f;
  uint8 constant internal FLAG_ADDRESS_W4            = 0x40;
  uint8 constant internal FLAG_DYNAMIC_SIGNATURE     = 0x41;
  uint8 constant internal FLAG_NODE                  = 0x42;
  uint8 constant internal FLAG_BRANCH                = 0x43;
  uint8 constant internal FLAG_SUBDIGEST             = 0x44;
  uint8 constant internal FLAG_NESTED                = 0x45;

  uint8 constant internal HIGHEST_FLAG = FLAG_NESTED;

  function readAdvanced(
    uint256 _pointer
  ) internal returns (
    bytes memory data,
    uint256 newPointer
  ) {
    unchecked {
      uint256 flag;
      (flag, newPointer) = msg.data.readUint8(_pointer);

      // None
      if (flag == FLAG_READ_BYTES32_0_BYTES) {
        return (data, newPointer);

      // Read 1 byte to 32 bytes (0x01, 0x02, etc)
      } else if (flag <= FLAG_READ_BYTES32_32_BYTES) {
        data = msg.data[newPointer:newPointer + flag];
        newPointer += flag;
        return (data, newPointer);
      
      // Read 20 bytes and save it
      } else if (flag == FLAG_SAVE_ADDRESS) {
        address addr;
        (addr, newPointer) = msg.data.readAddress(newPointer);
        knownAdresses[nextIndexAddress()] = addr;
        data = msg.data[newPointer - 20: newPointer];
        return (data, newPointer);

      // Read 32 bytes and save it
      } else if (flag == FLAG_SAVE_BYTES32) {
        bytes32 bytes32data;
        (bytes32data, newPointer) = msg.data.readBytes32(newPointer);
        knownBytes32s[nextIndexBytes32()] = bytes32data;
        data = msg.data[newPointer - 32: newPointer];
        return (data, newPointer);

      // Read 32 bytes using a 2 to 5 bytes pointer - 0x23 0x24 0x25 0x26
      } else if (flag >= FLAG_READ_BYTES32_2_BYTES && flag < FLAG_READ_BYTES32_5_BYTES) {
        uint256 index;
        uint256 b = flag - 0x21;
        (index, newPointer) = msg.data.readUintX(b, newPointer);
        data = abi.encode(knownBytes32s[index]);
        return (data, newPointer);

      // Read an address using a 2 to 5 bytes pointer - 0x27 0x28 0x29 0x2a
      } else if (flag >= FLAG_READ_ADDRESS_2_BYTES && flag < FLAG_READ_ADDRESS_5_BYTES) {
        uint256 index;
        uint256 b = flag - 0x25;
        (index, newPointer) = msg.data.readUintX(b, newPointer);
        data = abi.encodePacked(knownAdresses[index]);
        return (data, newPointer);

      // Read power of 2
      } else if (flag == 0x2b) {
        uint256 power;
        (power, newPointer) = msg.data.readUint8(newPointer);
        data = abi.encode(2 ** power);
        return (data, newPointer);

      // Nothing
      } else if (flag == 0x2c) {
        return (data, newPointer);

      // ONE
      } else if (flag == 0x2d) {
        data = abi.encode(1);
        return (data, newPointer);

      // Complex (dynamic size, many reads)
      } else if (flag == 0x2e) {
        bytes memory scrap;

        (scrap, newPointer) = readAdvanced(newPointer);
        uint256 size = bytesToUint256(scrap);

        for (uint256 read = 0; read < size;) {
          (scrap, newPointer) = readAdvanced(newPointer);
          data = abi.encodePacked(data, scrap);
          read += scrap.length;
        }

        return (data, newPointer);

      // Read size and that many bytes
      } else if (flag == FLAG_READ_N_BYTES) {
        bytes memory scrap;

        (scrap, newPointer) = readAdvanced(newPointer);
        uint256 size = bytesToUint256(scrap);

        uint256 nextPointer = newPointer + size;
        data = msg.data[newPointer:nextPointer];
        newPointer = nextPointer;

        return (data, newPointer);

      // Read abi pending encode
      } else if (flag <= FLAG_ABI_6_PARAMS) {
        // Read the number of params
        uint256 nparams = flag - FLAG_ABI_1_PARAM + 1;

        // Read selector
        bytes4 selector;
        (selector, newPointer) = msg.data.readBytes4(newPointer);

        data = abi.encodePacked(selector);
        bytes memory data2;

        for (uint256 i = 0; i < nparams; i++) {
          (data2, newPointer) = readAdvanced(newPointer);
          // TODO: Handle dynamic data

          data = abi.encodePacked(data, abi.encode(bytesToUint256(data2)));
        }

        return (data, newPointer);

      // Read signature
      } else if (flag <= FLAG_SIGNATURE_W4) {
        uint256 weight = flag - FLAG_SIGNATURE + 1;
        if (weight == 0) {
          // Then the weight must be loaded from the next byte
          (weight, newPointer) = msg.data.readUint8(newPointer);
        }

        // Sequence EOA signatures use 66 bytes
        // these will never be a pointer
        uint256 nextPointer = newPointer + 66;
        data = abi.encodePacked(uint8(SequenceBaseSig.FLAG_SIGNATURE), uint8(weight), msg.data[newPointer:nextPointer]);
        newPointer = nextPointer;

        return (data, newPointer);

      // Read address
      } else if (flag <= FLAG_ADDRESS_W4) {
        uint256 weight;
        if (flag == FLAG_ADDRESS) {
          // Then the weight must be loaded from the next byte
          (weight, newPointer) = msg.data.readUint8(newPointer);
        } else {
          weight = flag - FLAG_ADDRESS_W0;
        }

        // Read advanced, since the address may be known
        (data, newPointer) = readAdvanced(newPointer);
        address addr = bytesToAddress(data);
        data = abi.encodePacked(uint8(SequenceBaseSig.FLAG_ADDRESS), uint8(weight), addr);

        return (data, newPointer);
      
      // Read dynamic signature
      } else if (flag == FLAG_DYNAMIC_SIGNATURE) {
        // Read weigth, always 1 byte
        uint256 weight;
        (weight, newPointer) = msg.data.readUint8(newPointer);

        // Read address, use advanced read as it may be a pointer
        (data, newPointer) = readAdvanced(newPointer);
        address addr = bytesToAddress(data);

        // Read rest of the signature
        // use advanced, as it may contain more pointers!
        (data, newPointer) = readAllSignature(newPointer);

        // Encode everything packed together
        data = abi.encodePacked(uint8(SequenceBaseSig.FLAG_DYNAMIC_SIGNATURE), uint8(weight), addr, uint24(data.length + 1), data, uint8(3));
        return (data, newPointer);

      // Read node
      } else if (flag == FLAG_NODE) {
        // Use advanced as it may contain a pointer
        (data, newPointer) = readAdvanced(newPointer);
        uint256 node = bytesToUint256(data);
        data = abi.encodePacked(uint8(SequenceBaseSig.FLAG_NODE), node);

        return (data, newPointer);

      // Read branch
      } else if (flag == FLAG_BRANCH) {
        (data, newPointer) = readSignatureBranch(newPointer);
        data = abi.encodePacked(uint8(SequenceBaseSig.FLAG_BRANCH), uint24(data.length), data);

        return (data, newPointer);

      // Read nested
      } else if (flag == FLAG_NESTED) {
        uint256 externalWeight;
        (externalWeight, newPointer) = msg.data.readUint8(newPointer);

        (data, newPointer) = readAdvanced(newPointer);
        uint256 internalThreshold = bytesToUint256(data);

        (data, newPointer) = readSignatureBranch(newPointer);
        data = abi.encodePacked(uint8(SequenceBaseSig.FLAG_NESTED), uint8(externalWeight), uint8(internalThreshold), uint24(data.length), data);

        return (data, newPointer);

      // Read subdigest
      } else if (flag == FLAG_SUBDIGEST) {
        (data, newPointer) = readAdvanced(newPointer);
        uint256 subdigest = bytesToUint256(data);
        data = abi.encodePacked(uint8(SequenceBaseSig.FLAG_SUBDIGEST), subdigest);

        return (data, newPointer);
      }

      // If no flag is defined, then this is a literal number
      uint8 val = uint8(flag) - HIGHEST_FLAG;
      return (abi.encodePacked(val), newPointer);

      // revert UnknownFlag(flag, _pointer);
    }
  }
}


contract L2SequenceCompressor is L2SequenceDecompressor {
  using LibBytesPointer for bytes;
  using LibBytes for bytes;

  function encodeSequenceTransaction(
    address _wallet,
    IModuleCalls.Transaction[] memory _transactions,
    uint256 _nonce,
    bytes calldata _signature
  ) external view returns (bytes memory encoded) {
    // Encode the wallet address first
    encoded = encodeAddress(_wallet);

    // Encode the number of transactions
    encoded = abi.encodePacked(encoded, encode(_transactions.length));

    // Encode every transaction one after another
    for (uint256 i = 0; i < _transactions.length; i++) {
      encoded = abi.encodePacked(encoded, encodeTransaction(_wallet, _transactions[i]));
    }

    // Encode nonce
    encoded = abi.encodePacked(encoded, encodeNonce(_nonce));

    // Encode signature
    encoded = abi.encodePacked(encoded, encodeSignature(_signature));
  }

  function requiredBytesFor(bytes32 value) internal pure returns (uint8) {
    return requiredBytesFor(uint256(value));
  }

  function requiredBytesFor(uint256 value) internal pure returns (uint8) {
    if (value <= type(uint8).max) {
      return 1;
    } else if (value <= type(uint16).max) {
      return 2;
    } else if (value <= type(uint24).max) {
      return 3;
    } else if (value <= type(uint32).max) {
      return 4;
    } else if (value <= type(uint40).max) {
      return 5;
    } else if (value <= type(uint48).max) {
      return 6;
    } else if (value <= type(uint56).max) {
      return 7;
    } else if (value <= type(uint64).max) {
      return 8;
    } else if (value <= type(uint72).max) {
      return 9;
    } else if (value <= type(uint80).max) {
      return 10;
    } else if (value <= type(uint88).max) {
      return 11;
    } else if (value <= type(uint96).max) {
      return 12;
    } else if (value <= type(uint104).max) {
      return 13;
    } else if (value <= type(uint112).max) {
      return 14;
    } else if (value <= type(uint120).max) {
      return 15;
    } else if (value <= type(uint128).max) {
      return 16;
    } else if (value <= type(uint136).max) {
      return 17;
    } else if (value <= type(uint144).max) {
      return 18;
    } else if (value <= type(uint152).max) {
      return 19;
    } else if (value <= type(uint160).max) {
      return 20;
    } else if (value <= type(uint168).max) {
      return 21;
    } else if (value <= type(uint176).max) {
      return 22;
    } else if (value <= type(uint184).max) {
      return 23;
    } else if (value <= type(uint192).max) {
      return 24;
    } else if (value <= type(uint200).max) {
      return 25;
    } else if (value <= type(uint208).max) {
      return 26;
    } else if (value <= type(uint216).max) {
      return 27;
    } else if (value <= type(uint224).max) {
      return 28;
    } else if (value <= type(uint232).max) {
      return 29;
    } else if (value <= type(uint240).max) {
      return 30;
    } else if (value <= type(uint248).max) {
      return 31;
    }

    return 32;
  }

  function packToBytes(bytes32 value, uint256 b) internal pure returns (bytes memory) {
    return packToBytes(uint256(value), b);
  }

  function packToBytes(uint256 value, uint256 b) internal pure returns (bytes memory) {
    if (b == 1) {
      return abi.encodePacked(uint8(value));
    } else if (b == 2) {
      return abi.encodePacked(uint16(value));
    } else if (b == 3) {
      return abi.encodePacked(uint24(value));
    } else if (b == 4) {
      return abi.encodePacked(uint32(value));
    } else if (b == 5) {
      return abi.encodePacked(uint40(value));
    } else if (b == 6) {
      return abi.encodePacked(uint48(value));
    } else if (b == 7) {
      return abi.encodePacked(uint56(value));
    } else if (b == 8) {
      return abi.encodePacked(uint64(value));
    } else if (b == 9) {
      return abi.encodePacked(uint72(value));
    } else if (b == 10) {
      return abi.encodePacked(uint80(value));
    } else if (b == 11) {
      return abi.encodePacked(uint88(value));
    } else if (b == 12) {
      return abi.encodePacked(uint96(value));
    } else if (b == 13) {
      return abi.encodePacked(uint104(value));
    } else if (b == 14) {
      return abi.encodePacked(uint112(value));
    } else if (b == 15) {
      return abi.encodePacked(uint120(value));
    } else if (b == 16) {
      return abi.encodePacked(uint128(value));
    } else if (b == 17) {
      return abi.encodePacked(uint136(value));
    } else if (b == 18) {
      return abi.encodePacked(uint144(value));
    } else if (b == 19) {
      return abi.encodePacked(uint152(value));
    } else if (b == 20) {
      return abi.encodePacked(uint160(value));
    } else if (b == 21) {
      return abi.encodePacked(uint168(value));
    } else if (b == 22) {
      return abi.encodePacked(uint176(value));
    } else if (b == 23) {
      return abi.encodePacked(uint184(value));
    } else if (b == 24) {
      return abi.encodePacked(uint192(value));
    } else if (b == 25) {
      return abi.encodePacked(uint200(value));
    } else if (b == 26) {
      return abi.encodePacked(uint208(value));
    } else if (b == 27) {
      return abi.encodePacked(uint216(value));
    } else if (b == 28) {
      return abi.encodePacked(uint224(value));
    } else if (b == 29) {
      return abi.encodePacked(uint232(value));
    } else if (b == 30) {
      return abi.encodePacked(uint240(value));
    } else if (b == 31) {
      return abi.encodePacked(uint248(value));
    } else if (b == 32) {
      return abi.encodePacked(uint256(value));
    } else {
      revert("Invalid number of bytes");
    }
  }

  function encodeNonce(uint256 _nonce) internal view returns (bytes memory encoded) {
    unchecked {
      (uint256 space, uint256 nonce) = SubModuleNonce.decodeNonce(_nonce);
      return abi.encodePacked(encode(space), encode(nonce));
    }
  }

  function encodeTransaction(address _wallet, IModuleCalls.Transaction memory _tx) internal view returns (bytes memory data) {
    unchecked {
      // TODO: Handle nested sequence

      bool hasValue = _tx.value != 0;
      bool hasGasLimit = _tx.gasLimit != 0;
      bool hasData = _tx.data.length != 0;
      bool selfTarget = _tx.target == _wallet;

      uint8 flag = 0;

      if (_tx.delegateCall) {
        flag |= 0x80;
      }

      if (_tx.revertOnError) {
        flag |= 0x40;
      }

      if (hasGasLimit) {
        flag |= 0x20;

        data = encode(_tx.gasLimit);
      }

      if (hasValue) {
        flag |= 0x10;

        data = abi.encodePacked(data, encode(_tx.value));
      }

      if (hasData) {
        flag |= 0x08;

        data = abi.encodePacked(data, encodeCalldata(_tx.data));
      }

      if (selfTarget) {
        flag |= 0x04;
      } else {
        data = abi.encodePacked(data, encodeAddress(_tx.target));
      }

      data = abi.encodePacked(flag, data);
    }
  }

  function encodeAddress(address _addr) internal view returns (bytes memory encoded) {
    unchecked {
      // Find address in knownAdresses
      (uint256 size,) = numKnownAddresses();

      for (uint256 i = 0; i < size; i++) {
        if (knownAdresses[i] == _addr) {
          uint256 needs = requiredBytesFor(i);
          needs = ((needs < 2) ? 2 : needs);
          uint8 flag = FLAG_READ_ADDRESS_2_BYTES + uint8(needs - 2);
          return abi.encodePacked(flag, packToBytes(i, needs));
        }
      }

      // If not found, then we can save it
      return abi.encodePacked(FLAG_SAVE_ADDRESS, _addr);
    }
  }

  function encodeBytes32(bytes32 _b) internal view returns (bytes memory encoded) {
    unchecked {
      // Find bytes32 in knownBytes32s
      (uint256 size,) = numKnownBytes32();

      for (uint256 i = 0; i < size; i++) {
        if (knownBytes32s[i] == _b) {
          uint256 needs = requiredBytesFor(i);
          needs = ((needs < 2) ? 2 : needs);
          uint8 flag = FLAG_READ_BYTES32_2_BYTES + uint8(needs - 2);
          return abi.encodePacked(flag, packToBytes(i, needs));
        }
      }

      return abi.encodePacked(FLAG_SAVE_BYTES32, _b);
    }
  }

  function encodeCalldata(bytes memory _b) internal view returns (bytes memory encoded) {
    // Not calldata
    if (_b.length < 4 || (_b.length - 4) % 32 != 0) {
      return encodeBytes(_b);
    }

    // Too many params
    uint256 paramsNum = (_b.length - 4) / 32;
    if (paramsNum > 6) {
      return encodeBytes(_b);
    }

    // If all entries require 256 bits then we should just encode it as bytes
    bool canOptimize;

    for (uint256 i = 4; i < _b.length; i += 32) {
      if (requiredBytesFor(_b.readMBytes32(i)) != 32) {
        canOptimize = true;
        break;
      }
    }

    if (!canOptimize) {
      return encodeBytes(_b);
    }

    bytes4 selector = _b.readMBytes4(0);
    uint8 flag = uint8(FLAG_ABI_1_PARAM + paramsNum - 1);

    encoded = abi.encodePacked(flag, selector);

    for (uint256 i = 4; i < _b.length; i += 32) {
      encoded = abi.encodePacked(encoded, encode(_b.readMBytes32(i)));
    }
  }

  function encodeSignature(bytes calldata _b) internal view returns (bytes memory encoded) {
    // If it does not start with 0x00, then we must just encode the bytes
    if (_b.length == 0 || (_b[0] != 0x00 && _b[0] != 0x01) || _b.length < 6) {
      return abi.encodePacked(bytes1(0x00), encodeBytes(_b));
    }

    uint256 threshold;
    uint256 rindex = 1;

    // Start by decode the threshold, this is just the next byte or two
    if (_b[0] == 0x00) {
      threshold = uint256(uint8(_b[rindex]));
      rindex += 1;
    } else {
      (threshold, rindex) = _b.readUint16(rindex);
    }

    // Now decode the checkpoint, this is the next 4 bytes
    uint256 checkpoint = uint32(_b.readMBytes4(rindex));
    rindex += 4;

    // Encode branch
    bool failed;
    (encoded, failed) = encodeSignatureBranch(_b, rindex);

    if (failed) {
      return abi.encodePacked(uint8(0x00), encodeBytes(_b));
    }

    encoded = abi.encodePacked(uint8(0x01), encode(threshold), encode(checkpoint), encoded);
  }

  function encodeSignatureBranch(bytes calldata _b, uint256 _rindex) internal view returns (bytes memory encoded, bool failed) {
    uint256 totalParts;
    uint256 rindex = _rindex;

    // Now decode part by part, until the signature is complete
    while (rindex < _b.length) {
      // Read next item type
      uint256 flag;
      (flag, rindex) = LibBytesPointer.readUint8(_b, rindex);

      totalParts++;

      if (flag == SequenceBaseSig.FLAG_ADDRESS) {
        uint8 addrWeight; address addr;
        (addrWeight, addr, rindex) = _b.readUint8Address(rindex);

        // If weight is <= 4, then it is encoded on the flag
        // if not we need flag + weight
        if (addrWeight > 4) {
          encoded = abi.encodePacked(encoded, FLAG_ADDRESS, uint8(addrWeight), encodeAddress(addr));
        } else {
          uint8 flag2 = FLAG_ADDRESS_W0 + addrWeight;
          encoded = abi.encodePacked(encoded, flag2, encodeAddress(addr));
        }

        continue;
      }

      if (flag == SequenceBaseSig.FLAG_SIGNATURE) {
        // Read weight
        uint8 addrWeight;
        (addrWeight, rindex) = LibBytesPointer.readUint8(_b, rindex);

        // Read single signature and recover signer
        uint256 nrindex = rindex + 66;
        if (nrindex > _b.length) {
          return (encoded, true);
        }

        bytes memory signature = _b[rindex:nrindex];
        rindex = nrindex;

        if (addrWeight > 4) {
          encoded = abi.encodePacked(encoded, FLAG_SIGNATURE, uint8(addrWeight), signature);
        } else {
          uint8 flag2 = FLAG_SIGNATURE_W1 + addrWeight - 2;
          encoded = abi.encodePacked(encoded, flag2, signature);
        }

        continue;
      }

      if (flag == SequenceBaseSig.FLAG_DYNAMIC_SIGNATURE) {        // Read signer and weight
        uint8 addrWeight; address addr;
        (addrWeight, addr, rindex) = _b.readUint8Address(rindex);

        // Read signature size
        uint256 size;
        (size, rindex) = _b.readUint24(rindex);

        // Read dynamic size signature
        uint256 nrindex = rindex + size;
        if (nrindex > _b.length) {
          return (encoded, true);
        }

        // If last byte is not 0x03 lets abort, but if it is
        // remove it. The encoder knows to add it bacl.
        if (_b[nrindex - 1] != 0x03) {
          return (encoded, true);
        }

        bytes calldata signature = _b[rindex:nrindex - 1];
        rindex = nrindex;

        bytes memory r = encodeSignature(signature);
        encoded = abi.encodePacked(encoded, FLAG_DYNAMIC_SIGNATURE, uint8(addrWeight), encodeAddress(addr), r);
        continue;
      }

      if (flag == SequenceBaseSig.FLAG_NODE) {
        // Read node hash
        bytes32 node;
        (node, rindex) = LibBytesPointer.readBytes32(_b, rindex);

        encoded = abi.encodePacked(encoded, FLAG_NODE, encode(node));

        continue;
      }

      if (flag == SequenceBaseSig.FLAG_BRANCH) {
        // Enter a branch of the signature merkle tree
        uint256 size;
        (size, rindex) = _b.readUint24(rindex);

        uint256 nrindex = rindex + size;
        if (nrindex > _b.length) {
          return (encoded, true);
        }
        bytes calldata data = _b[rindex:nrindex];
        rindex = nrindex;

        bytes memory sub;
        (sub, failed) = encodeSignatureBranch(data, 0);
        if (failed) {
          return (encoded, true);
        }

        encoded = abi.encodePacked(encoded, FLAG_BRANCH, sub);

        continue;
      }

      if (flag == SequenceBaseSig.FLAG_NESTED) {
        // Enter a branch of the signature merkle tree
        // but with an internal threshold and an external fixed weight
        uint256 externalWeight;
        (externalWeight, rindex) = LibBytesPointer.readUint8(_b, rindex);

        uint256 internalThreshold;
        (internalThreshold, rindex) = _b.readUint16(rindex);

        uint256 size;
        (size, rindex) = _b.readUint24(rindex);
        uint256 nrindex = rindex + size;
        if (nrindex > _b.length) {
          return (encoded, true);
        }
        bytes calldata data = _b[rindex:nrindex];
        rindex = nrindex;

        bytes memory sub;
        (sub, failed) = encodeSignatureBranch(data, 0);
        if (failed) {
          return (encoded, true);
        }

        encoded = abi.encodePacked(encoded, FLAG_NESTED, uint8(externalWeight), encode(internalThreshold), sub);

        continue;
      }

      if (flag == FLAG_SUBDIGEST) {
        // A hardcoded always accepted digest
        // it pushes the weight to the maximum
        bytes32 hardcoded;
        (hardcoded, rindex) = LibBytesPointer.readBytes32(_b, rindex);

        encoded = abi.encodePacked(encoded, FLAG_SUBDIGEST, encode(hardcoded));
        continue;
      }

      // There is something wrong here, this doesn't look like a normal sequence signature
      // we can still salvage it by encoding it as a regular set of bytes
      return (encoded, true);
    }

    encoded = abi.encodePacked(encode(totalParts), encoded);
  }

  function encodeBytes(bytes memory _b) internal view returns (bytes memory encoded) {
    return abi.encodePacked(FLAG_READ_N_BYTES, encode(_b.length), _b);
  }

  function encode(uint256 _val) internal view returns (bytes memory encoded) {
    return encode(bytes32(_val));
  }

  function encode(bytes32 _val) internal view returns (bytes memory encoded) {
    if (_val == 0) {
      return abi.encodePacked(FLAG_READ_BYTES32_0_BYTES);
    }

    // If value is below (type(uint8).max - HIGHEST_FLAG)
    // then it can be encoded directly on the FLAG by adding HIGHEST_FLAG
    if (uint256(_val) <= type(uint8).max - HIGHEST_FLAG) {
      return abi.encodePacked(uint8(uint256(_val)) + HIGHEST_FLAG);
    }

    // TODO Encode as raw value (1 to 64 maybe ?)
    uint256 needs = requiredBytesFor(_val);

    // If it needs 20 bytes can be encoded as an address
    if (needs == 20) {
      return encodeAddress(address(uint160(uint256(_val))));
    }

    // If it needs 32 bytes, can be encoded as a hash
    if (needs == 32) {
      return encodeBytes32(_val);
    }

    uint8 flag = FLAG_READ_BYTES32_0_BYTES + uint8(needs);
    return abi.encodePacked(flag, packToBytes(_val, needs));
  }
}

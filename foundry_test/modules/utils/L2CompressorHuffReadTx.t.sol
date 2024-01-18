// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "foundry_test/base/AdvTest.sol";

import "forge-std/console.sol";
import "forge-std/console2.sol";

import { HuffConfig } from "foundry-huff/HuffConfig.sol";
import { HuffDeployer } from "foundry-huff/HuffDeployer.sol";

import "contracts/modules/commons/interfaces/IModuleCalls.sol";

uint256 constant FMS = 0xa0;

function requiredBytesFor(bytes32 value) pure returns (uint8) {
  return requiredBytesFor(uint256(value));
}

function requiredBytesFor(uint256 value) pure returns (uint8) {
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

function packToBytes(bytes32 value, uint256 b) pure returns (bytes memory) {
  return packToBytes(uint256(value), b);
}

function packToBytes(uint256 value, uint256 b) pure returns (bytes memory) {
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

function encodeWord(uint256 _value) pure returns (bytes memory) {
  uint8 b = requiredBytesFor(_value);
  return abi.encodePacked(b, packToBytes(_value, b));
}

function build_flag(bool _delegateCall, bool _revertOnError, bool _hasGasLimit, bool _hasValue, bool _hasData) pure returns (uint8) {
  uint8 res = 0;

  if (_delegateCall) {
    res |= 128;
  }

  if (_revertOnError) {
    res |= 64;
  }

  if (_hasGasLimit) {
    res |= 32;
  }

  if (_hasValue) {
    res |= 16;
  }

  // Hasdata uses first bit
  if (_hasData) {
    res |= 1;
  }

  return res;
}

function encode_raw_address(address _addr) pure returns (bytes memory) {
  return encodeWord(uint256(uint160(_addr)));
}

function encode_bytes_n(bytes memory _data) pure returns (bytes memory) {
  return abi.encodePacked(uint8(0x2b), encodeWord(_data.length), _data);
}

contract L2CompressorHuffReadTxTests is AdvTest {
  address public imp;

  function setUp() public {
    imp = address(
      HuffDeployer
        .config()
        .with_evm_version("paris")
        .deploy("imps/L2CompressorReadTx")
    );
  }

  function test_read_simple_transaction(address _addr) external {
    bytes memory encoded = abi.encodePacked(build_flag(true, true, false, false, false), encode_raw_address(_addr));

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    IModuleCalls.Transaction memory t;
    t.delegateCall = true;
    t.revertOnError = true;
    t.target = _addr;

    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Abi encode prefixes with the point on which the data starts
    // we don't do it on the compressor, so we need to append 32
    assertEq(abi.encodePacked(abi.encode(32), res), abi.encode(t));
  }

  function test_read_simple_transaction_with_data(address _addr, bytes memory _data) external {
    bytes memory encoded = abi.encodePacked(
      build_flag(true, true, false, false, true),
      encode_raw_address(_addr),
      encode_bytes_n(_data)
    );

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    IModuleCalls.Transaction memory t;
    t.delegateCall = true;
    t.revertOnError = true;
    t.target = _addr;
    t.data = _data;

    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Abi encode prefixes with the point on which the data starts
    // we don't do it on the compressor, so we need to append 32
    assertEq(abi.encodePacked(abi.encode(32), res), abi.encode(t));
  }

  function test_read_transaction(IModuleCalls.Transaction memory _tx) external {
    bytes memory encoded = abi.encodePacked(
      build_flag(_tx.delegateCall, _tx.revertOnError, _tx.gasLimit != 0, _tx.value != 0, _tx.data.length != 0),
      _tx.gasLimit != 0 ? encodeWord(_tx.gasLimit) : bytes(""),
      encode_raw_address(_tx.target),
      _tx.value != 0 ? encodeWord(_tx.value) : bytes(""),
      _tx.data.length != 0 ? encode_bytes_n(_tx.data) : bytes("")
    );

    console.logBytes(encoded);

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Abi encode prefixes with the point on which the data starts
    // we don't do it on the compressor, so we need to append 32
    assertEq(abi.encodePacked(abi.encode(32), res), abi.encode(_tx));
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "foundry_test/base/AdvTest.sol";

import "forge-std/console.sol";
import "forge-std/console2.sol";

import { HuffConfig } from "foundry-huff/HuffConfig.sol";
import { HuffDeployer } from "foundry-huff/HuffDeployer.sol";

import "contracts/modules/commons/interfaces/IModuleCalls.sol";

import "./L2CompressorEncoder.sol";

uint256 constant FMS = 0xa0;

contract L2CompressorHuffReadExecuteTest is AdvTest {
  address public imp;

  function setUp() public {
    imp = address(
      HuffDeployer
        .config()
        .with_evm_version("paris")
        .deploy("imps/L2CompressorReadExecute")
    );
  }

  function test_read_simple_execute(
    IModuleCalls.Transaction[] calldata _txs,
    uint160 _space,
    uint96 _nonce,
    bytes calldata _signature
  ) external {
    vm.assume(_txs.length != 0 && _txs.length <= type(uint8).max);

    bytes32 packedNonce = abi.decode(abi.encodePacked(_space, _nonce), (bytes32));

    bytes memory encoded = abi.encodePacked(
      encodeWord(_space), encodeWord(_nonce),
      uint8(_txs.length)
    );

    for (uint256 i = 0; i < _txs.length; i++) {
      IModuleCalls.Transaction memory t = _txs[i];

      encoded = abi.encodePacked(
        encoded,
        build_flag(t.delegateCall, t.revertOnError, t.gasLimit != 0, t.value != 0, t.data.length != 0),
        t.gasLimit != 0 ? encodeWord(t.gasLimit) : bytes(""),
        encode_raw_address(t.target),
        t.value != 0 ? encodeWord(t.value) : bytes(""),
        t.data.length != 0 ? encode_bytes_n(t.data) : bytes("")
      );
    }

    encoded = abi.encodePacked(
      encoded,
      encode_bytes_n(_signature)
    );

    (bool s, bytes memory r) = imp.staticcall(encoded);

    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));

    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Encode using solidity
    bytes memory solidityEncoded = abi.encodeWithSelector(IModuleCalls.execute.selector, _txs, packedNonce, _signature);
    assertEq(solidityEncoded, res);
  }

  function test_read_nested_execute(
    address _wallet,
    IModuleCalls.Transaction[] calldata _txs,
    uint160 _space,
    uint96 _nonce,
    bytes calldata _signature
  ) external {
    vm.assume(_txs.length != 0 && _txs.length <= type(uint8).max);
    bytes32 packedNonce = abi.decode(abi.encodePacked(_space, _nonce), (bytes32));

    IModuleCalls.Transaction[] memory outerTx = new IModuleCalls.Transaction[](1);
    outerTx[0] = IModuleCalls.Transaction({
      delegateCall: false,
      revertOnError: false,
      gasLimit: 0,
      target: _wallet,
      value: 0,
      data: abi.encodeWithSelector(IModuleCalls.execute.selector, _txs, packedNonce, _signature)
    });

    bytes memory outerSignature = hex"112233";
    bytes32 outerNonce = bytes32(0);

    bytes memory encoded = abi.encodePacked(
      encodeWord(bytes32(0)), encodeWord(bytes32(0)),
      uint8(1),  // One transaction
      build_flag(outerTx[0].delegateCall, outerTx[0].revertOnError, outerTx[0].gasLimit != 0, outerTx[0].value != 0, outerTx[0].data.length != 0),
      bytes(""),
      encode_raw_address(outerTx[0].target),
      bytes("")
    );

    // Encode the inner transaction
    encoded = abi.encodePacked(
      encoded,
      uint8(0x26), // Read EXECUTE flag
      encodeWord(_space), encodeWord(_nonce),
      uint8(_txs.length)
    );

    for (uint256 i = 0; i < _txs.length; i++) {
      IModuleCalls.Transaction memory t = _txs[i];

      encoded = abi.encodePacked(
        encoded,
        build_flag(t.delegateCall, t.revertOnError, t.gasLimit != 0, t.value != 0, t.data.length != 0),
        t.gasLimit != 0 ? encodeWord(t.gasLimit) : bytes(""),
        encode_raw_address(t.target),
        t.value != 0 ? encodeWord(t.value) : bytes(""),
        t.data.length != 0 ? encode_bytes_n(t.data) : bytes("")
      );
    }

    encoded = abi.encodePacked(
      encoded,
      encode_bytes_n(_signature)
    );

    // Encode the outer signature
    encoded = abi.encodePacked(
      encoded,
      encode_bytes_n(outerSignature)
    );

    (bool s, bytes memory r) = imp.staticcall(encoded);
    assertTrue(s);
    (uint256 rindex, uint256 windex, bytes memory res) = abi.decode(r, (uint256, uint256, bytes));
    assertEq(rindex, encoded.length);
    assertEq(windex, res.length + FMS);

    // Encode using solidity
    bytes memory solidityEncoded = abi.encodeWithSelector(IModuleCalls.execute.selector, outerTx, outerNonce, outerSignature);
    assertEq(solidityEncoded, res);
  }
}

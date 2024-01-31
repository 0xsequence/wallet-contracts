// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "foundry_test/base/AdvTest.sol";

import "forge-std/console.sol";
import "forge-std/console2.sol";

import { HuffConfig } from "foundry-huff/HuffConfig.sol";
import { HuffDeployer } from "foundry-huff/HuffDeployer.sol";

import "contracts/modules/commons/interfaces/IModuleCalls.sol";

import "./L2CompressorEncoder.sol";

contract L2CompressorHuffTest is AdvTest {
  address public imp;

  function setUp() public {
    imp = address(
      HuffDeployer
        .config()
        .with_evm_version("paris")
        .deploy("L2Compressor")
    );
  }

  function test_execute(
    IModuleCalls.Transaction[] calldata _txs,
    uint160 _space,
    uint96 _nonce,
    bytes calldata _signature
  ) external {
    vm.assume(_txs.length != 0 && _txs.length <= type(uint8).max);

    bytes32 packedNonce = abi.decode(abi.encodePacked(_space, _nonce), (bytes32));

    bytes memory encoded = abi.encodePacked(
      hex"00",
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
      encode_bytes_n(_signature),
      encodeWord(uint256(uint160(address(0xEbD3186Ab4524330A866BE6866bE7bB55A173a23))))
    );

    vm.expectCall(
      address(0xEbD3186Ab4524330A866BE6866bE7bB55A173a23),
      0,
      abi.encodeWithSelector(
        IModuleCalls.execute.selector,
        _txs,
        packedNonce,
        _signature
      )
    );

    (bool s, bytes memory r) = imp.call(encoded);
    assertTrue(s);
    assertEq(r, bytes(""));
  }

  struct BatchMember {
    IModuleCalls.Transaction[] txs;
    uint160 space;
    uint96 nonce;
    bytes signature;
  }
  
  function test_execute_many_2(BatchMember memory _batch1, BatchMember memory _batch2) external {
    BatchMember[] memory batch = new BatchMember[](2);
    batch[0] = _batch1;
    batch[1] = _batch2;
    test_execute_many(batch);
  }

  function test_execute_many(BatchMember[] memory _batch) internal {
    vm.assume(_batch.length != 0 && _batch.length <= type(uint8).max);

    uint256 size = mayBoundArr(_batch.length);
    size = size == 0 ? 1 : size;

    bytes memory encoded = abi.encodePacked(
      hex"01",
      uint8(size)
    );

    for (uint256 i = 0; i < size; i++) {
      vm.assume(_batch[i].txs.length <= type(uint8).max);

      if (_batch[i].txs.length == 0) {
        _batch[i].txs = new IModuleCalls.Transaction[](1);
      }

      bytes32 packedNonce = abi.decode(abi.encodePacked(_batch[i].space, _batch[i].nonce), (bytes32));

      encoded = abi.encodePacked(
        encoded,
        encodeWord(_batch[i].space), encodeWord(_batch[i].nonce),
        uint8(_batch[i].txs.length)
      );

      for (uint256 x = 0; x < _batch[i].txs.length; x++) {
        IModuleCalls.Transaction memory t = _batch[i].txs[x];

        encoded = abi.encodePacked(
          encoded,
          build_flag(t.delegateCall, t.revertOnError, t.gasLimit != 0, t.value != 0, t.data.length != 0),
          t.gasLimit != 0 ? encodeWord(t.gasLimit) : bytes(""),
          encode_raw_address(t.target),
          t.value != 0 ? encodeWord(t.value) : bytes(""),
          t.data.length != 0 ? encode_bytes_n(t.data) : bytes("")
        );
      }

      // Derive a random address from i
      address addr = address(uint160(uint256(keccak256(abi.encode(i)))));

      encoded = abi.encodePacked(
        encoded,
        encode_bytes_n(_batch[i].signature),
        encodeWord(uint256(uint160(addr)))
      );

      vm.expectCall(
        addr,
        0,
        abi.encodeWithSelector(
          IModuleCalls.execute.selector,
          _batch[i].txs,
          packedNonce,
          _batch[i].signature
        )
      );
    }

    (bool s,) = imp.call{ gas: type(uint64).max }(encoded);
    assertTrue(s);
  }

  function test_read_addresses() external {
    vm.store(imp, bytes32(uint256(1)), bytes32(uint256(1000)));
    vm.store(imp, bytes32(uint256(2)), bytes32(uint256(2000)));

    (bool s, bytes memory r) = imp.call(abi.encodePacked(hex"02", uint256(0)));
    assertTrue(s);
  
    assertEq(r, abi.encode(bytes32(uint256(1000))));

    (s, r) = imp.call(abi.encodePacked(hex"02", uint256(1)));
    assertTrue(s);

    assertEq(r, abi.encode(bytes32(uint256(2000))));
  }

  function test_read_bytes32() external {
    vm.store(imp, bytes32(uint256(0)) << 128, bytes32(uint256(1000)));
    vm.store(imp, bytes32(uint256(1)) << 128, bytes32(uint256(2000)));

    (bool s, bytes memory r) = imp.call(abi.encodePacked(hex"03", uint256(0)));
    assertTrue(s);
  
    assertEq(r, abi.encode(bytes32(uint256(1000))));

    (s, r) = imp.call(abi.encodePacked(hex"03", uint256(1)));
    assertTrue(s);

    assertEq(r, abi.encode(bytes32(uint256(2000))));
  }

  function test_read_storage_slots() external {
    vm.store(imp, bytes32(uint256(0)) << 128, bytes32(uint256(1000)));
    vm.store(imp, bytes32(uint256(1)) << 128, bytes32(uint256(2000)));
    vm.store(imp, bytes32(uint256(1)), bytes32(uint256(4000)));
    vm.store(imp, bytes32(uint256(2)), bytes32(uint256(5000)));

    (bool s, bytes memory r) = imp.call(abi.encodePacked(
      hex"05",
      uint256(0) << 128,
      uint256(1),
      uint256(1) << 128,
      uint256(2)
    ));

    assertTrue(s);
  
    assertEq(r, abi.encode(uint256(1000), uint256(4000), uint256(2000), uint256(5000)));
  }

  function test_read_size() external {
    bytes32 word = keccak256(abi.encode(uint256(0)));
    vm.store(imp, bytes32(0), word);

    (bool s, bytes memory r) = imp.call(abi.encodePacked(hex"04"));

    assertTrue(s);
    assertEq(r, abi.encode(word));
  }

  function test_decode_execute(
    IModuleCalls.Transaction[] calldata _txs,
    uint160 _space,
    uint96 _nonce,
    bytes calldata _signature
  ) external {
    vm.assume(_txs.length != 0 && _txs.length <= type(uint8).max);

    bytes32 packedNonce = abi.decode(abi.encodePacked(_space, _nonce), (bytes32));

    bytes memory encoded = abi.encodePacked(
      hex"06",
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
      encode_bytes_n(_signature),
      encodeWord(uint256(uint160(address(0xEbD3186Ab4524330A866BE6866bE7bB55A173a23))))
    );

    (bool s, bytes memory r) = imp.call(encoded);
    assertTrue(s);
    assertEq(r, abi.encodePacked(abi.encodeWithSelector(
      IModuleCalls.execute.selector,
      _txs,
      packedNonce,
      _signature
    ), uint256(uint160(address(0xEbD3186Ab4524330A866BE6866bE7bB55A173a23)))));
  }

  function test_decode_execute_many_2(BatchMember memory _batch1, BatchMember memory _batch2) external {
    BatchMember[] memory batch = new BatchMember[](2);
    batch[0] = _batch1;
    batch[1] = _batch2;
    test_decode_execute_many(batch);
  }

  function test_decode_execute_many(BatchMember[] memory _batch) internal {
    vm.assume(_batch.length != 0 && _batch.length <= type(uint8).max);

    uint256 size = mayBoundArr(_batch.length);
    size = size == 0 ? 1 : size;

    bytes memory encoded = abi.encodePacked(
      hex"07",
      uint8(size)
    );

    bytes memory expected;

    for (uint256 i = 0; i < size; i++) {
      vm.assume(_batch[i].txs.length <= type(uint8).max);

      if (_batch[i].txs.length == 0) {
        _batch[i].txs = new IModuleCalls.Transaction[](1);
      }

      bytes32 packedNonce = abi.decode(abi.encodePacked(_batch[i].space, _batch[i].nonce), (bytes32));

      encoded = abi.encodePacked(
        encoded,
        encodeWord(_batch[i].space), encodeWord(_batch[i].nonce),
        uint8(_batch[i].txs.length)
      );

      for (uint256 x = 0; x < _batch[i].txs.length; x++) {
        IModuleCalls.Transaction memory t = _batch[i].txs[x];

        encoded = abi.encodePacked(
          encoded,
          build_flag(t.delegateCall, t.revertOnError, t.gasLimit != 0, t.value != 0, t.data.length != 0),
          t.gasLimit != 0 ? encodeWord(t.gasLimit) : bytes(""),
          encode_raw_address(t.target),
          t.value != 0 ? encodeWord(t.value) : bytes(""),
          t.data.length != 0 ? encode_bytes_n(t.data) : bytes("")
        );
      }

      // Derive a random address from i
      address addr = address(uint160(uint256(keccak256(abi.encode(i)))));

      encoded = abi.encodePacked(
        encoded,
        encode_bytes_n(_batch[i].signature),
        encodeWord(uint256(uint160(addr)))
      );

      expected = abi.encodePacked(
        expected,
        abi.encodeWithSelector(
          IModuleCalls.execute.selector,
          _batch[i].txs,
          packedNonce,
          _batch[i].signature
        ),
        uint256(uint160(addr))
      );
    }

    (bool s, bytes memory r) = imp.call{ gas: type(uint64).max }(encoded);
    assertTrue(s);
    assertEq(r, expected);
  }
}

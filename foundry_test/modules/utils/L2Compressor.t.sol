// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/modules/utils/L2Compressor.sol";

import "foundry_test/base/AdvTest.sol";


contract L2SequenceDecompressorImp is L2SequenceCompressor {
  function decodeTransaction() external returns (
    address wallet,
    IModuleCalls.Transaction[] memory transactions,
    uint256 nonce,
    bytes memory signature,
    uint256 newPointer
  ) {
    // Account for the selector of this function
    return decodeSequenceTransaction(4);
  }
}

contract L2SequenceCompressorTest is AdvTest {
  L2SequenceDecompressorImp imp;

  function setUp() external {
    imp = new L2SequenceDecompressorImp();
  }

  function decode(bytes memory _b) internal returns (
    address wallet,
    IModuleCalls.Transaction[] memory transactions,
    uint256 nonce,
    bytes memory signature
  ) {
    (bool s, bytes memory res) = address(imp).call(abi.encodePacked(imp.decodeTransaction.selector, _b));
    assertTrue(s);
    (wallet, transactions, nonce, signature) = abi.decode(res, (address, IModuleCalls.Transaction[], uint256, bytes));
  }


  function test_encodeSimpleSequenceTX() external {
    address wallet = address(0x1234567890123456789012345678901234567890);

    IModuleCalls.Transaction[] memory transactions = new IModuleCalls.Transaction[](1);
    transactions[0] = IModuleCalls.Transaction({
      target: address(0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E),
      value: 99,
      data: hex"12345678",
      delegateCall: false,
      revertOnError: false,
      gasLimit: 90000
    });

    uint256 nonce = 1;

    bytes memory signature = hex"00000000000000000000000000000000000000000000000000000000000023a5";

    bytes memory encoded1 = imp.encodeSequenceTransaction(wallet, transactions, nonce, signature);

    bytes memory abiEncoded = abi.encode(wallet, transactions, nonce, signature);
    assertLt(encoded1.length, abiEncoded.length);

    // Try decoding once
    (
      address rwallet,
      IModuleCalls.Transaction[] memory rtransactions,
      uint256 rnonce,
      bytes memory rsignature
    ) = decode(encoded1);

    assertEq(rwallet, wallet);
    assertEq(rtransactions.length, 1);
    assertEq(rtransactions[0].target, transactions[0].target);
    assertEq(rtransactions[0].value, transactions[0].value);
    assertEq(rtransactions[0].data, transactions[0].data);
    assertEq(rtransactions[0].delegateCall, transactions[0].delegateCall);
    assertEq(rtransactions[0].revertOnError, transactions[0].revertOnError);
    assertEq(rtransactions[0].gasLimit, transactions[0].gasLimit);
    assertEq(rnonce, nonce);
    assertEq(rsignature, signature);

    bytes memory encoded2 = imp.encodeSequenceTransaction(rwallet, rtransactions, rnonce, rsignature);
    
    // Some values are now cached
    assertLt(encoded2.length, encoded1.length);

    // Try decoding again
    (rwallet, rtransactions, rnonce, rsignature) = decode(encoded2);

    assertEq(rwallet, wallet);
    assertEq(rtransactions.length, 1);
    assertEq(rtransactions[0].target, transactions[0].target);
    assertEq(rtransactions[0].value, transactions[0].value);
    assertEq(rtransactions[0].data, transactions[0].data);
    assertEq(rtransactions[0].delegateCall, transactions[0].delegateCall);
    assertEq(rtransactions[0].revertOnError, transactions[0].revertOnError);
    assertEq(rtransactions[0].gasLimit, transactions[0].gasLimit);
    assertEq(rnonce, nonce);
    assertEq(rsignature, signature);
  }

  function test_encodeSimpleSequenceTXRealSignature() external {
    address wallet = address(0x1234567890123456789012345678901234567890);

    IModuleCalls.Transaction[] memory transactions = new IModuleCalls.Transaction[](1);
    transactions[0] = IModuleCalls.Transaction({
      target: address(0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E),
      value: 99,
      data: hex"12345678",
      delegateCall: false,
      revertOnError: false,
      gasLimit: 90000
    });

    uint256 nonce = 1;

    bytes memory signature = hex"01000500000001000221061c54b3f1f996605e1070463dbdef820305538629803cafd1dbafdb9d43c95c2eae0c8258889cf8f8743c9f04569f2e0062ec3fb769a3c8d8cb0a2fe7a8381c020400007b0203761f5e29944d79d76656323f106cf2efbf5f09e9000062010001000000000001aa411a41ea71709acf5023018de99c28f1d04f4ddbd1ec6d77fd375fb6abe34360c44e35928925aadd05fb24b119c7b2cbd40f1405c86c3717bd5d686aaee4b41b02010190d62a32d1cc65aa3e80b567c8c0d3ca0f411e610304000016010372d0bfe2a60353bc118d888a688cb6b0213b09e3040000160102f9ea588949feeee5d803490c7c0d101f3e6e0861";

    bytes memory encoded1 = imp.encodeSequenceTransaction(wallet, transactions, nonce, signature);
    console.log("encoded 1");
    console.logBytes(encoded1);

    bytes memory abiEncoded = abi.encode(wallet, transactions, nonce, signature);
    assertLt(encoded1.length, abiEncoded.length);

    // Try decoding once
    (
      address rwallet,
      IModuleCalls.Transaction[] memory rtransactions,
      uint256 rnonce,
      bytes memory rsignature
    ) = decode(encoded1);

    assertEq(rwallet, wallet);
    assertEq(rtransactions.length, 1);
    assertEq(rtransactions[0].target, transactions[0].target);
    assertEq(rtransactions[0].value, transactions[0].value);
    assertEq(rtransactions[0].data, transactions[0].data);
    assertEq(rtransactions[0].delegateCall, transactions[0].delegateCall);
    assertEq(rtransactions[0].revertOnError, transactions[0].revertOnError);
    assertEq(rtransactions[0].gasLimit, transactions[0].gasLimit);
    assertEq(rnonce, nonce);
    assertEq(rsignature, signature);

    bytes memory encoded2 = imp.encodeSequenceTransaction(rwallet, rtransactions, rnonce, rsignature);
    console.logBytes(encoded2);

    // Some values are now cached
    assertLt(encoded2.length, encoded1.length);

    // Try decoding again
    (rwallet, rtransactions, rnonce, rsignature) = decode(encoded2);

    assertEq(rwallet, wallet);
    assertEq(rtransactions.length, 1);
    assertEq(rtransactions[0].target, transactions[0].target);
    assertEq(rtransactions[0].value, transactions[0].value);
    assertEq(rtransactions[0].data, transactions[0].data);
    assertEq(rtransactions[0].delegateCall, transactions[0].delegateCall);
    assertEq(rtransactions[0].revertOnError, transactions[0].revertOnError);
    assertEq(rtransactions[0].gasLimit, transactions[0].gasLimit);
    assertEq(rnonce, nonce);
    assertEq(rsignature, signature);
  }


  function test_encodeSingleSequenceTX(
    address _wallet,
    IModuleCalls.Transaction memory _tx,
    uint256 _nonce,
    bytes memory _signature
  ) external {
    IModuleCalls.Transaction[] memory transactions = new IModuleCalls.Transaction[](1);
    transactions[0] = _tx;

    bytes memory encoded1 = imp.encodeSequenceTransaction(_wallet, transactions, _nonce, _signature);

    {
      bytes memory abiEncoded = abi.encode(_wallet, transactions, _nonce, _signature);
      assertLt(encoded1.length, abiEncoded.length);
    }

    // Try decoding once
    (
      address rwallet,
      IModuleCalls.Transaction[] memory rtransactions,
      uint256 rnonce,
      bytes memory rsignature
    ) = decode(encoded1);

    assertEq(rwallet, _wallet);
    assertEq(rtransactions.length, 1);
    assertEq(rtransactions[0].target, _tx.target);
    assertEq(rtransactions[0].value, _tx.value);
    assertEq(rtransactions[0].data, _tx.data);
    assertEq(rtransactions[0].delegateCall, _tx.delegateCall);
    assertEq(rtransactions[0].revertOnError, _tx.revertOnError);
    assertEq(rtransactions[0].gasLimit, _tx.gasLimit);
    assertEq(rnonce, _nonce);
    assertEq(rsignature, _signature);

    bytes memory encoded2 = imp.encodeSequenceTransaction(rwallet, rtransactions, rnonce, rsignature);
    assertLt(encoded2.length, encoded1.length);

    // Try decoding again
    (rwallet, rtransactions, rnonce, rsignature) = decode(encoded2);

    assertEq(rwallet, _wallet);
    assertEq(rtransactions.length, 1);
    assertEq(rtransactions[0].target, _tx.target);
    assertEq(rtransactions[0].value, _tx.value);
    assertEq(rtransactions[0].data, _tx.data);
    assertEq(rtransactions[0].delegateCall, _tx.delegateCall);
    assertEq(rtransactions[0].revertOnError, _tx.revertOnError);
    assertEq(rtransactions[0].gasLimit, _tx.gasLimit);
    assertEq(rnonce, _nonce);
    assertEq(rsignature, _signature);
  }
  

  function test_encodeManySequenceTXs(
    address _wallet,
    IModuleCalls.Transaction[] memory _txs,
    uint256 _nonce,
    bytes memory _signature
  ) external {
    uint256 size = mayBoundArr(_txs.length);
    if (size != _txs.length) {
      IModuleCalls.Transaction[] memory _txs2 = new IModuleCalls.Transaction[](size);
      for (uint256 i = 0; i < size; i++) {
        _txs2[i] = _txs[i];
      }
      _txs = _txs2;
    }

    bytes memory encoded1 = imp.encodeSequenceTransaction(_wallet, _txs, _nonce, _signature);

    {
      bytes memory abiEncoded = abi.encode(_wallet, _txs, _nonce, _signature);
      assertLt(encoded1.length, abiEncoded.length);
    }

    // Try decoding once
    (
      address rwallet,
      IModuleCalls.Transaction[] memory rtransactions,
      uint256 rnonce,
      bytes memory rsignature
    ) = decode(encoded1);

    assertEq(rwallet, _wallet);
    assertEq(rtransactions.length, _txs.length);
    for (uint256 i = 0; i < _txs.length; i++) {
      assertEq(rtransactions[i].target, _txs[i].target);
      assertEq(rtransactions[i].value, _txs[i].value);
      assertEq(rtransactions[i].data, _txs[i].data);
      assertEq(rtransactions[i].delegateCall, _txs[i].delegateCall);
      assertEq(rtransactions[i].revertOnError, _txs[i].revertOnError);
      assertEq(rtransactions[i].gasLimit, _txs[i].gasLimit);
    }
    assertEq(rnonce, _nonce);
    assertEq(rsignature, _signature);

    bytes memory encoded2 = imp.encodeSequenceTransaction(rwallet, rtransactions, rnonce, rsignature);
    assertLt(encoded2.length, encoded1.length);

    // Try decoding again
    (rwallet, rtransactions, rnonce, rsignature) = decode(encoded2);

    assertEq(rwallet, _wallet);
    assertEq(rtransactions.length, _txs.length);
    for (uint256 i = 0; i < _txs.length; i++) {
      assertEq(rtransactions[i].target, _txs[i].target);
      assertEq(rtransactions[i].value, _txs[i].value);
      assertEq(rtransactions[i].data, _txs[i].data);
      assertEq(rtransactions[i].delegateCall, _txs[i].delegateCall);
      assertEq(rtransactions[i].revertOnError, _txs[i].revertOnError);
      assertEq(rtransactions[i].gasLimit, _txs[i].gasLimit);
    }
    assertEq(rnonce, _nonce);
    assertEq(rsignature, _signature);
  }

  function test_encodeCallData_single() external {
    address wallet = address(0x1234567890123456789012345678901234567890);

    IModuleCalls.Transaction[] memory transactions = new IModuleCalls.Transaction[](1);
    transactions[0] = IModuleCalls.Transaction({
      target: address(0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E),
      value: 99,
      data: abi.encodeWithSelector(
        bytes4(keccak256("transferFrom(address,uint256)")),
        address(0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E),
        address(0x1234567890123456789012345678901234567890),
        99
      ),
      delegateCall: false,
      revertOnError: false,
      gasLimit: 90000
    });

    uint256 nonce = 1;

    bytes memory signature = hex"111111111111111111111111111111111111111111111111111111111111111111";

    bytes memory encoded1 = imp.encodeSequenceTransaction(wallet, transactions, nonce, signature);

    bytes memory abiEncoded = abi.encode(wallet, transactions, nonce, signature);
    assertLt(encoded1.length, abiEncoded.length);

    // Try decoding once
    (
      address rwallet,
      IModuleCalls.Transaction[] memory rtransactions,
      uint256 rnonce,
      bytes memory rsignature
    ) = decode(encoded1);

    assertEq(rwallet, wallet);
    assertEq(rtransactions.length, 1);
    assertEq(rtransactions[0].target, transactions[0].target);
    assertEq(rtransactions[0].value, transactions[0].value);
    assertEq(rtransactions[0].data, transactions[0].data);
    assertEq(rtransactions[0].delegateCall, transactions[0].delegateCall);
    assertEq(rtransactions[0].revertOnError, transactions[0].revertOnError);
    assertEq(rtransactions[0].gasLimit, transactions[0].gasLimit);
    assertEq(rnonce, nonce);
    assertEq(rsignature, signature);

    bytes memory encoded2 = imp.encodeSequenceTransaction(rwallet, rtransactions, rnonce, rsignature);
    
    // Some values are now cached
    assertLt(encoded2.length, encoded1.length);

    // Try decoding again
    (rwallet, rtransactions, rnonce, rsignature) = decode(encoded2);

    assertEq(rwallet, wallet);
    assertEq(rtransactions.length, 1);
    assertEq(rtransactions[0].target, transactions[0].target);
    assertEq(rtransactions[0].value, transactions[0].value);
    assertEq(rtransactions[0].data, transactions[0].data);
    assertEq(rtransactions[0].delegateCall, transactions[0].delegateCall);
    assertEq(rtransactions[0].revertOnError, transactions[0].revertOnError);
    assertEq(rtransactions[0].gasLimit, transactions[0].gasLimit);
    assertEq(rnonce, nonce);
    assertEq(rsignature, signature);
  }
}
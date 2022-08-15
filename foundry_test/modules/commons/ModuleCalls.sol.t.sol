// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.14;

import "contracts/modules/commons/ModuleCalls.sol";

import "foundry_test/base/AdvTest.sol";


contract ImmutableBytes {
  bytes public b;

  constructor (bytes memory _b) {
    b = _b;
  }

  fallback() external payable {}
  receive() external payable {}
}

contract WillRevert {
  ImmutableBytes immutable private ib;

  constructor (bytes memory _err) {
    ib = new ImmutableBytes(_err);
  }

  fallback() external payable {
    _revert();
  }

  receive() external payable {
    _revert();
  }

  function _revert() internal {
    bytes memory e = ib.b();
    assembly {
      revert(add(e, 32), mload(e))
    }
  }
}

contract WillDelegateTo {
  address immutable private expectSelf;
  bytes32 immutable private expectData;
  address immutable private delegate;

  constructor (address _expectSelf, bytes memory _expectData) {
    expectSelf = _expectSelf;
    expectData = keccak256(_expectData);
    delegate = address(this);
  }

  fallback() external payable {
    _check();
  }

  receive() external payable {
    _check();
  }

  function _check() internal {
    bytes32 dataHash = keccak256(msg.data);
    require(dataHash == expectData && address(this) == expectSelf);

    bytes32 key = keccak256(abi.encode(delegate));
    assembly { sstore(key, add(sload(key), 1)) }
  }
}

contract ModuleCallsImp is ModuleCalls {
  function validateNonce(uint256 _rawNonce) external {
    _validateNonce(_rawNonce);
  }

  // Module Auth imp
  mapping(bytes32 => mapping(bytes => bytes32)) public sigToSubdigest;
  mapping(bytes32 => mapping(bytes => bool)) public sigToIsValid;

  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal override view returns (
    bool isValid,
    bytes32 subDigest
  ) {
    subDigest = sigToSubdigest[_digest][_signature];
    isValid = sigToIsValid[_digest][_signature];
  }

  function mockSignature(
    bytes32 _digest,
    bytes calldata _signature,
    bytes32 _subDigest,
    bool _isValid
  ) external  {
    sigToSubdigest[_digest][_signature] = _subDigest;
    sigToIsValid[_digest][_signature] = _isValid;
  }

  function signatureRecovery(bytes32, bytes calldata) public override view returns (
    uint256, uint256, bytes32, bytes32
  ) {
  }

  function _isValidImage(bytes32) internal override view returns (bool) {
  }

  function updateImageHash(bytes32) external override {
  }
}

contract ModuleCallsTest is AdvTest {
  ModuleCallsImp private imp;

  function setUp() external {
    imp = new ModuleCallsImp();
  }

  struct ToValAndData {
    address target;
    uint256 value;
    bytes data;
  }

  event TxExecuted(bytes32 _tx) anonymous;
  event NonceChange(uint256 _space, uint256 _newNonce);
  event TxFailed(bytes32 _tx, bytes _reason);

  function test_execute(ToValAndData[] memory _rtxs, bytes memory _sig, bytes32 _subdigest) external {
    uint256 size = mayBoundArr(_rtxs.length);
    IModuleCalls.Transaction[] memory txs = new IModuleCalls.Transaction[](size);
    uint256 total;

    for (uint256 i = 0; i < size; i++) {
      txs[i].data = _rtxs[i].data;
      txs[i].target = boundNoSys(_rtxs[i].target);
      txs[i].value = bound(_rtxs[i].value, 0, type(uint256).max - total);

      total += txs[i].value;
    }

    vm.deal(address(imp), total);
    bytes32 digest = keccak256(abi.encode(0, txs));
    imp.mockSignature(digest, _sig, _subdigest, false);

    vm.expectRevert(abi.encodeWithSignature('InvalidSignature(bytes32,bytes)', _subdigest, _sig));
    imp.execute(txs, 0, _sig);

    vm.expectRevert(abi.encodeWithSignature('BadNonce(uint256,uint256,uint256)', 0, 1, 0));
    imp.execute(txs, 1, _sig);

    imp.mockSignature(digest, _sig, _subdigest, true);

    vm.expectEmit(true, true, true, true, address(imp));
    emit NonceChange(0, 1);

    for (uint256 i = 0; i < size; i++) {
      vm.expectCall(txs[i].target, txs[i].data);
    }

    imp.execute(txs, 0, _sig);

    assertEq(imp.nonce(), 1);

    for (uint256 i = 0; i < size; i++) {
      assertTrue(txs[i].target.balance >= txs[i].value);
    }
  }

  function test_execute_reverts(
    ToValAndData[] memory _rtxs,
    uint256 _reverti,
    bool _revertsOnErr,
    bool _delegateCall,
    bytes memory _err,
    bytes memory _sig,
    bytes32 _subdigest
  ) external {
    uint256 size = mayBoundArr(_rtxs.length);
    vm.assume(size != 0);

    IModuleCalls.Transaction[] memory txs = new IModuleCalls.Transaction[](size);
    uint256 total;

    _reverti = bound(_reverti, 0, size - 1);

    address willRevert = address(new WillRevert(_err));

    for (uint256 i = 0; i < size; i++) {
      if (_reverti == i) {
        txs[i].target = willRevert;
        txs[i].revertOnError = _revertsOnErr;
        txs[i].delegateCall = _delegateCall;
      } else {
        txs[i].target = boundNoSys(_rtxs[i].target);
      }

      txs[i].data = _rtxs[i].data;
      txs[i].value = bound(_rtxs[i].value, 0, type(uint256).max - total);

      total += txs[i].value;
    }

    vm.deal(address(imp), total);

    bytes32 digest = keccak256(abi.encode(0, txs));
    imp.mockSignature(digest, _sig, _subdigest, true);


    if (_revertsOnErr) {
      vm.expectRevert(_err);
    }

    imp.execute(txs, 0, _sig);

    for (uint256 i = 0; i < size; i++) {
      if (_revertsOnErr || txs[i].target == willRevert) {
        assertEq(txs[i].target.balance, 0);
      } else {
        assertTrue(txs[i].target.balance >= txs[i].value);
      }
    }
  }

  function test_execute_delegateCall(
    ToValAndData[] memory _rtxs,
    bytes memory _sig,
    bytes32 _subdigest
  ) external {
    uint256 size = mayBoundArr(_rtxs.length);
    IModuleCalls.Transaction[] memory txs = new IModuleCalls.Transaction[](size);

    for (uint256 i = 0; i < size; i++) {
      txs[i].data = _rtxs[i].data;
      txs[i].target = address(new WillDelegateTo(address(imp), _rtxs[i].data));
      txs[i].value = _rtxs[i].value;
      txs[i].delegateCall = true;
    }

    bytes32 digest = keccak256(abi.encode(0, txs));
    imp.mockSignature(digest, _sig, _subdigest, true);

    imp.execute(txs, 0, _sig);
    assertEq(imp.nonce(), 1);

    for (uint256 i = 0; i < size; i++) {
      bytes32 key = keccak256(abi.encode(txs[i].target));
      assertTrue(uint256(vm.load(address(imp), key)) != 0);
    }
  }
}

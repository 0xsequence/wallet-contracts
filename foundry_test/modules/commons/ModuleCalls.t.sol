// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/modules/commons/ModuleCalls.sol";
import "contracts/Factory.sol";

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

  function _revert() internal view {
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

  function writeNonce(uint256 _space, uint256 _nonce) external {
    _writeNonce(_space, _nonce);
  }

  // Module Auth imp
  mapping(bytes32 => mapping(bytes => bytes32)) public sigToSubdigest;
  mapping(bytes32 => mapping(bytes => bool)) public sigToIsValid;

  function _signatureValidation(
    bytes32 _digest,
    bytes calldata _signature
  ) internal override view returns (
    bool isValid,
    bytes32 subdigest
  ) {
    subdigest = sigToSubdigest[_digest][_signature];
    isValid = sigToIsValid[_digest][_signature];
  }

  function mockSignature(
    bytes32 _digest,
    bytes calldata _signature,
    bytes32 _subdigest,
    bool _isValid
  ) external  {
    sigToSubdigest[_digest][_signature] = _subdigest;
    sigToIsValid[_digest][_signature] = _isValid;
  }

  function signatureRecovery(bytes32, bytes calldata) public override view returns (
    uint256, uint256, bytes32, bytes32, uint256
  ) {
  }

  function _isValidImage(bytes32) internal override view returns (bool) {
  }

  function updateImageHash(bytes32) external override {
  }

  function _updateImageHash(bytes32) internal override {
  }
}

contract ModuleCallsTest is AdvTest {
  ModuleCallsImp private template;
  ModuleCallsImp private imp;
  Factory private factory;

  function setUp() external {
    template = new ModuleCallsImp();
    factory = new Factory();
    imp = ModuleCallsImp(factory.deploy(address(template), bytes32(0)));
  }

  struct ToValAndData {
    address target;
    uint256 value;
    bytes data;
  }

  event TxExecuted(bytes32 _tx) anonymous;
  event NonceChange(uint256 _space, uint256 _newNonce);
  event TxFailed(bytes32 _tx, bytes _reason);
  event GapNonceChange(uint256 _space, uint256 _oldNonce, uint256 _newNonce);
  event NoNonceUsed();

  function test_execute(ToValAndData[] memory _rtxs, bytes memory _sig, bytes32 _subdigest) external {
    uint256 size = mayBoundArr(_rtxs.length);
    IModuleCalls.Transaction[] memory txs = new IModuleCalls.Transaction[](size);
    uint256 total;

    for (uint256 i = 0; i < size; i++) {
      txs[i].data = _rtxs[i].data;
      txs[i].target = boundNoBalance(boundNoContract(boundDiff(boundNoSys(_rtxs[i].target), address(template), address(imp), address(factory))));
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
        txs[i].target = boundNoBalance(boundNoContract(boundDiff(boundNoSys(_rtxs[i].target), address(template), address(imp), address(factory))));
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

  function test_selfExecute(ToValAndData[] memory _rtxs) external {
    uint256 size = mayBoundArr(_rtxs.length);
    IModuleCalls.Transaction[] memory txs = new IModuleCalls.Transaction[](size);
    uint256 total;

    for (uint256 i = 0; i < size; i++) {
      txs[i].data = _rtxs[i].data;
      txs[i].target = boundNoBalance(boundNoContract(boundDiff(boundNoSys(_rtxs[i].target), address(template), address(imp), address(factory))));
      txs[i].value = bound(_rtxs[i].value, 0, type(uint256).max - total);

      total += txs[i].value;
    }

    vm.deal(address(imp), total);

    for (uint256 i = 0; i < size; i++) {
      vm.expectCall(txs[i].target, txs[i].data);
    }

    vm.prank(address(imp));
    imp.selfExecute(txs);

    for (uint256 i = 0; i < size; i++) {
      assertTrue(txs[i].target.balance >= txs[i].value);
    }
  }

  function test_fail_selfExecute_NotSelf(ToValAndData[] memory _rtxs, address _notself) external {
    _notself = boundDiff(_notself, address(imp));

    uint256 size = mayBoundArr(_rtxs.length);
    IModuleCalls.Transaction[] memory txs = new IModuleCalls.Transaction[](size);

    for (uint256 i = 0; i < size; i++) {
      txs[i].data = _rtxs[i].data;
      txs[i].target = _rtxs[i].target;
      txs[i].value = _rtxs[i].value;
    }

    vm.prank(_notself);
    vm.expectRevert(abi.encodeWithSignature('OnlySelfAuth(address,address)', _notself, address(imp)));
    imp.selfExecute(txs);
  }

  function test_validateNonce_Normal(
    uint160 _space,
    uint88 _nonce
  ) external {
    uint256 encoded = uint256(
      abi.decode(
        abi.encodePacked(
          _space,
          uint8(0),
          _nonce
        ),
        (bytes32))
    );

    imp.writeNonce(_space, _nonce);

    vm.expectEmit(true, true, true, true, address(imp));
    emit NonceChange(_space, uint256(_nonce) + 1);
    imp.validateNonce(encoded);

    assertEq(imp.readNonce(_space), uint256(_nonce) + 1);
    assertEq(imp.nonce(), _space == 0 ? uint256(_nonce) + 1 : 0);
  }

 function test_fail_validateNonce_Normal_Bad(
    uint160 _space,
    uint88 _nonce,
    uint88 _badprev
  ) external {
    _badprev = uint88(boundDiff(_badprev, _nonce));

    uint256 encoded = uint256(
      abi.decode(
        abi.encodePacked(
          _space,
          uint8(0),
          _nonce
        ),
        (bytes32))
    );

    imp.writeNonce(_space, _badprev);

    vm.expectRevert(abi.encodeWithSignature('BadNonce(uint256,uint256,uint256)', _space, _nonce, _badprev));
    imp.validateNonce(encoded);
  }

  function test_fail_noDelegatecall(ToValAndData[] memory _rtxs, bytes memory _sig, uint256 _nonce) external {
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
    vm.expectRevert(abi.encodeWithSignature('OnlyDelegatecall()'));
    template.execute(txs, _nonce, _sig);
  }
}

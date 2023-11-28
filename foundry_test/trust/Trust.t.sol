// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/trust/Trust.sol";

import "foundry_test/base/AdvTest.sol";

function min(uint256 a, uint256 b) pure returns (uint256) {
  return a < b ? a : b;
}

contract MockFail {
  bytes revertData;

  constructor (bytes memory _revertData) {
    revertData = _revertData;
  }

  fallback() external payable {
    bytes memory rd = revertData;
    assembly {
      revert(add(rd, 0x20), mload(rd))
    }
  }
}

contract TrustTest is AdvTest {
  Trust private trust;

  function test_define_initial_parameters(uint256 _ownerPk, uint256 _beneficiaryPk, uint256 _duration) external {
    trust = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);
    assertEq(trust.owner(), vm.addr(boundPk(_ownerPk)));
    assertEq(trust.beneficiary(), vm.addr(boundPk(_beneficiaryPk)));
    assertEq(trust.duration(), _duration);
  }

  function test_start_locked(uint256 _ownerPk, uint256 _beneficiaryPk, uint256 _duration) external {
    trust = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);
    assertEq(trust.isLocked(), true);
  }

  function test_fail_schedule_unlock_too_early(uint256 _ownerPk, uint256 _beneficiaryPk, uint256 _duration, uint256 _schedule) external {
    vm.assume(_duration != 0);

    _schedule = bound(_schedule, 0, _duration - 1);
    trust = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.prank(vm.addr(boundPk(_ownerPk)));
    vm.expectRevert(abi.encodeWithSignature('UnlockTooEarly(uint256,uint256)', block.timestamp + _schedule, _schedule));
    trust.setUnlocksAt(block.timestamp + _schedule);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    vm.expectRevert(abi.encodeWithSignature('UnlockTooEarly(uint256,uint256)', block.timestamp + _schedule, _schedule));
    trust.setUnlocksAt(block.timestamp + _schedule);
  }

  function test_fail_schedule_in_the_past(uint256 _ownerPk, uint256 _beneficiaryPk, uint256 _duration, uint256 _schedule) external {
    _schedule = bound(_schedule, 1, block.timestamp);
    trust = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.prank(vm.addr(boundPk(_ownerPk)));
    vm.expectRevert(abi.encodeWithSignature('UnlockInThePast(uint256,uint256)', block.timestamp - _schedule, _schedule));
    trust.setUnlocksAt(block.timestamp - _schedule);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    vm.expectRevert(abi.encodeWithSignature('UnlockInThePast(uint256,uint256)', block.timestamp - _schedule, _schedule));
    trust.setUnlocksAt(block.timestamp - _schedule);
  }

  function test_fail_schedule_non_allowed(uint256 _ownerPk, uint256 _beneficiaryPk, uint256 _badActorpk, uint256 _duration, uint256 _unlockAt) external {
    _badActorpk = boundDiff(boundPk(_badActorpk), boundPk(_ownerPk), boundPk(_beneficiaryPk));

    trust = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.prank(vm.addr(boundPk(_badActorpk)));
    vm.expectRevert(abi.encodeWithSignature('NotOwner(address)', vm.addr(boundPk(_badActorpk))));
    trust.setUnlocksAt(_unlockAt);
  }

  event SetUnlocksAt(uint256 _unlocksAt);

  function test_schedule_unlock(uint256 _ownerPk, uint256 _beneficiaryPk, bool _asOwner, uint256 _duration, uint256 _unlockAt) external {
    _duration = bound(_duration, 0, type(uint256).max - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max);

    trust = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.prank(vm.addr(boundPk(_asOwner ? _ownerPk : _beneficiaryPk)));

    vm.expectEmit(true, true, true, true, address(trust));
    emit SetUnlocksAt(_unlockAt);

    trust.setUnlocksAt(_unlockAt);
    assertEq(trust.unlocksAt(), _unlockAt);
  }

  function test_wait_for_unlock(uint256 _ownerPk, uint256 _beneficiaryPk, uint256 _duration, uint256 _unlockAt, uint256 _extra) external {
    vm.assume(block.timestamp != type(uint256).max);

    _duration = bound(_duration, 0, (type(uint256).max - 1) - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max - 1);
    _extra    = bound(_extra, 0, type(uint256).max - _unlockAt);

    trust = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    trust.setUnlocksAt(_unlockAt);

    if (_duration > 0) {
      vm.prank(vm.addr(boundPk(_beneficiaryPk)));
      assertEq(trust.isLocked(), true);
    }

    vm.warp(_unlockAt + _extra);
    assertEq(trust.isLocked(), false);
  }

  function gen_and_unlock(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    uint256 _duration,
    uint256 _unlockAt,
    uint256 _extra
  ) internal returns (Trust) {
    _duration = bound(_duration, 0, (type(uint256).max - 1) - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max - 1);
    _extra    = bound(_extra, 0, type(uint256).max - _unlockAt);

    trust = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    trust.setUnlocksAt(_unlockAt);

    vm.warp(_unlockAt + _extra);

    return trust;
  }

  event SentTransaction(address _to, uint256 _value, bytes _data, bytes _result);

  function test_send_transaction_after_unlock(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    bool    _ownerSender,
    uint256 _duration,
    uint256 _unlockAt,
    uint256 _extra,
    uint256 _toPk,
    uint256 _value,
    bytes calldata _data
  ) external {
    Trust t = gen_and_unlock(
      _ownerPk,
      _beneficiaryPk,
      _duration,
      _unlockAt,
      _extra
    );

    vm.deal(address(this), _value);
    payable(address((t))).transfer(_value);

    vm.prank(vm.addr(boundPk(_ownerSender ? _ownerPk : _beneficiaryPk)));
    vm.expectCall(vm.addr(boundPk(_toPk)), _value, _data);

    vm.expectEmit(true, true, true, true, address(t));
    emit SentTransaction(vm.addr(boundPk(_toPk)), _value, _data, new bytes(0));

    t.sendTransaction(payable(vm.addr(boundPk(_toPk))), _value, _data);

    assertEq(vm.addr(boundPk(_toPk)).balance, _value);
  }

  function test_send_transaction_pre_unlock_as_owner(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    uint256 _duration,
    uint256 _unlockAt,
    uint256 _toPk,
    uint256 _value,
    bytes calldata _data
  ) external {
    _duration = bound(_duration, 0, type(uint256).max - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max);

    Trust t = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.deal(address(this), _value);
    payable(address((t))).transfer(_value);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    t.setUnlocksAt(_unlockAt);

    vm.prank(vm.addr(boundPk(_ownerPk)));
    vm.expectCall(vm.addr(boundPk(_toPk)), _value, _data);
    t.sendTransaction(payable(vm.addr(boundPk(_toPk))), _value, _data);
  }

  function test_fail_send_transaction_pre_unlock_as_beneficiary(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    uint256 _duration,
    uint256 _unlockAt,
    uint256 _toPk,
    uint256 _value,
    uint256 _elapsed,
    bytes calldata _data
  ) external {
    _duration = bound(_duration, 1, type(uint256).max - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max);
    _elapsed  = bound(_elapsed, 0, (_unlockAt - block.timestamp) - 1);

    vm.assume(vm.addr(boundPk(_ownerPk)) != vm.addr(boundPk(_beneficiaryPk)));

    Trust t = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.deal(address(this), _value);
    payable(address((t))).transfer(_value);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    t.setUnlocksAt(_unlockAt);

    vm.warp(block.timestamp + _elapsed);

    assertEq(t.isLocked(), true);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    vm.expectRevert(abi.encodeWithSignature('NotUnlocked(uint256)', _unlockAt));
    t.sendTransaction(payable(vm.addr(boundPk(_toPk))), _value, _data);
  }

  function test_fail_send_transaction_non_allowed(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    uint256 _badActorPk,
    uint256 _duration,
    uint256 _unlockAt,
    uint256 _elapsed,
    uint256 _toPk,
    uint256 _value,
    bytes calldata _data
  ) external {
    _duration = bound(_duration, 0, type(uint256).max - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max);
    _elapsed  = bound(_elapsed, 0, type(uint256).max - block.timestamp);

    _badActorPk = boundDiff(boundPk(_badActorPk), boundPk(_ownerPk), boundPk(_beneficiaryPk));

    Trust t = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.deal(address(this), _value);
    payable(address((t))).transfer(_value);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    t.setUnlocksAt(_unlockAt);

    vm.warp(block.timestamp + _elapsed);

    vm.prank(vm.addr(boundPk(_badActorPk)));
    vm.expectRevert(abi.encodeWithSignature('NotOwner(address)', vm.addr(boundPk(_badActorPk))));
    t.sendTransaction(payable(vm.addr(boundPk(_toPk))), _value, _data);
  }

  function test_fail_bubble_up_fail(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    bool    _ownerSender,
    uint256 _duration,
    uint256 _unlockAt,
    uint256 _value,
    uint256 _extra,
    bytes calldata _data,
    bytes calldata _revertData
  ) external {
    address sender = vm.addr(boundPk(_ownerSender ? _ownerPk : _beneficiaryPk));

    Trust t = gen_and_unlock(
      _ownerPk,
      _beneficiaryPk,
      _duration,
      _unlockAt,
      _extra
    );

    vm.deal(address(this), _value);
    payable(address((t))).transfer(_value);

    MockFail mf = new MockFail(_revertData);

    vm.prank(sender);

    vm.expectRevert(abi.encodeWithSignature(
      "FailedTransaction(address,uint256,bytes,bytes)",
      address(mf),
      _value,
      _data,
      _revertData
    ));

    t.sendTransaction(payable(address(mf)), _value, _data);
  }

  function test_isValidSignature(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    uint256 _duration,
    uint256 _unlockAt,
    uint256 _extra,
    bool _signedByOwner,
    bytes calldata _message
  ) external {
    uint256 signerPk = boundPk(_signedByOwner ? _ownerPk : _beneficiaryPk);

    Trust t = gen_and_unlock(
      _ownerPk,
      _beneficiaryPk,
      _duration,
      _unlockAt,
      _extra
    );

    bytes32 rawHash = keccak256(_message);
    bytes32 finalHash = keccak256(abi.encodePacked(address(t), rawHash));
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, finalHash);

    bytes memory sig = abi.encodePacked(r, s, v, uint8(1), _signedByOwner ? bytes1(0x00) : bytes1(0x01));

    assertEq(t.isValidSignature(rawHash, sig), bytes4(0x1626ba7e));
    assertEq(t.isValidSignature(_message, sig), bytes4(0x20c13b0b));
  }

  function test_isValidSignature_pre_unlock_as_owner(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    uint256 _duration,
    uint256 _unlockAt,
    bytes calldata _message
  ) external {
    _duration = bound(_duration, 0, type(uint256).max - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max);

    Trust t = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    t.setUnlocksAt(_unlockAt);

    bytes32 rawHash = keccak256(_message);
    bytes32 finalHash = keccak256(abi.encodePacked(address(t), rawHash));
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(boundPk(_ownerPk), finalHash);

    bytes memory sig = abi.encodePacked(r, s, v, uint8(1), bytes1(0x00));

    assertEq(t.isValidSignature(rawHash, sig), bytes4(0x1626ba7e));
    assertEq(t.isValidSignature(_message, sig), bytes4(0x20c13b0b));
  }

  function test_fail_isValidSignature_emptySignature(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    uint256 _duration,
    uint256 _unlockAt,
    bytes calldata _message
  ) external {
    _duration = bound(_duration, 0, type(uint256).max - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max);

    Trust t = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    t.setUnlocksAt(_unlockAt);

    bytes memory sig = new bytes(0);

    vm.expectRevert(abi.encodeWithSignature('EmptySignature()'));
    t.isValidSignature(_message, sig);

    vm.expectRevert(abi.encodeWithSignature('EmptySignature()'));
    t.isValidSignature(keccak256(_message), sig);
  }

  function test_fail_isValidSignature_wrongSignatureFlag(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    uint256 _duration,
    uint256 _unlockAt,
    uint8 _signerFlag,
    bytes calldata _signature,
    bytes calldata _message
  ) external {
    _duration = bound(_duration, 0, type(uint256).max - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max);
    _signerFlag = uint8(bound(_signerFlag, 2, type(uint8).max));

    Trust t = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    t.setUnlocksAt(_unlockAt);

    bytes memory sig = abi.encodePacked(_signature, _signerFlag);

    vm.expectRevert(abi.encodeWithSignature('InvalidSignatureFlag(bytes,bytes1)', sig, bytes1(_signerFlag)));
    t.isValidSignature(_message, sig);

    vm.expectRevert(abi.encodeWithSignature('InvalidSignatureFlag(bytes,bytes1)', sig, bytes1(_signerFlag)));
    t.isValidSignature(keccak256(_message), sig);
  }

  function test_fail_isValidSignature_pre_unlock_as_beneficiary(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    uint256 _duration,
    uint256 _unlockAt,
    bytes calldata _message
  ) external {
    _duration = bound(_duration, 1, type(uint256).max - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max);

    vm.assume(boundPk(_ownerPk) != boundPk(_beneficiaryPk));
    Trust t = new Trust(vm.addr(boundPk(_ownerPk)), vm.addr(boundPk(_beneficiaryPk)), _duration);

    vm.prank(vm.addr(boundPk(_beneficiaryPk)));
    t.setUnlocksAt(_unlockAt);

    bytes32 rawHash = keccak256(_message);
    bytes32 finalHash = keccak256(abi.encodePacked(address(t), rawHash));
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(boundPk(_beneficiaryPk), finalHash);

    bytes memory sig = abi.encodePacked(r, s, v, uint8(1), bytes1(0x01));

    vm.expectRevert(abi.encodeWithSignature('NotUnlocked(uint256)', _unlockAt));
    t.isValidSignature(rawHash, sig);

    vm.expectRevert(abi.encodeWithSignature('NotUnlocked(uint256)', _unlockAt));
    t.isValidSignature(_message, sig);
  }

  struct MemoryStruct1 {
    bytes32 rawHash;
    bytes32 finalHash;
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  function test_fail_isValidSignature_invalid_signature(
    uint256 _ownerPk,
    uint256 _beneficiaryPk,
    uint256 _badSignerPk,
    bool _signsOwner,
    uint256 _duration,
    uint256 _unlockAt,
    bytes calldata _message
  ) external {
    _ownerPk = boundPk(_ownerPk);
    _beneficiaryPk = boundPk(_beneficiaryPk);
    _badSignerPk = boundPk(_badSignerPk);

    address expectedSigner = _signsOwner ? vm.addr(_ownerPk) : vm.addr(_beneficiaryPk);

    _duration = bound(_duration, 0, type(uint256).max - block.timestamp);
    _unlockAt = bound(_unlockAt, block.timestamp + _duration, type(uint256).max);

    Trust t = new Trust(vm.addr(_ownerPk), vm.addr(_beneficiaryPk), _duration);

    vm.prank(vm.addr(_beneficiaryPk));
    t.setUnlocksAt(_unlockAt);

    if (_signsOwner) {
      vm.assume(_ownerPk != _badSignerPk);
    } else {
      vm.assume(_beneficiaryPk != _badSignerPk);
      // Advance clock to unlock
      vm.warp(_unlockAt); 
    }

    MemoryStruct1 memory m;
    {
      // Stack too deep manual workaround
      bytes32 rawHash = keccak256(_message);
      bytes32 finalHash = keccak256(abi.encodePacked(address(t), rawHash));
      (uint8 v, bytes32 r, bytes32 s) = vm.sign(_badSignerPk, finalHash);
      m.rawHash = rawHash;
      m.finalHash = finalHash;
      m.v = v;
      m.r = r;
      m.s = s;
    }

    bytes memory sig = abi.encodePacked(m.r, m.s, m.v, uint8(1), _signsOwner ? bytes1(0x00) : bytes1(0x01));

    bytes memory revertErr = abi.encodeWithSignature(
      'InvalidSignature(bytes32,bytes32,address,bytes)',
      m.rawHash,
      m.finalHash,
      expectedSigner,
      abi.encodePacked(m.r, m.s, m.v, uint8(1))
    );

    vm.expectRevert(revertErr);
    t.isValidSignature(m.rawHash, sig);

    vm.expectRevert(revertErr);
    t.isValidSignature(_message, sig);
  }
}

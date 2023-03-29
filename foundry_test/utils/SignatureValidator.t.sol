// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "contracts/utils/SignatureValidator.sol";

import "foundry_test/base/AdvTest.sol";

contract SignatureValidatorImp {
  function recoverSigner(bytes32 _hash, bytes calldata _signature) external pure returns (address) {
    return SignatureValidator.recoverSigner(_hash, _signature);
  }

  function isValidSignature(bytes32 _hash, address _signer, bytes calldata _signature) external view returns (bool) {
    return SignatureValidator.isValidSignature(_hash, _signer, _signature);
  }
}

contract SignatureValidatorTest is AdvTest {
  SignatureValidatorImp private lib;

  uint8 private constant SIG_TYPE_EIP712 = 1;
  uint8 private constant SIG_TYPE_ETH_SIGN = 2;
  uint8 private constant SIG_TYPE_WALLET_BYTES32 = 3;

  function setUp() public {
    lib = new SignatureValidatorImp();
  }

  function test_recoverSigner_EIP712(uint256 _pk, bytes32 _hash) external {
    _pk = boundPk(_pk);

    address signer = vm.addr(_pk);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(_pk, _hash);

    address recovered = lib.recoverSigner(_hash, abi.encodePacked(r, s, v, SIG_TYPE_EIP712));
    assertEq(signer, recovered);
  }

  function test_recoverSigner_ETHSIGN(uint256 _pk, bytes32 _hash) external {
    _pk = boundPk(_pk);

    address signer = vm.addr(_pk);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(_pk, keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)));

    address recovered = lib.recoverSigner(_hash, abi.encodePacked(r, s, v, SIG_TYPE_ETH_SIGN));
    assertEq(signer, recovered);
  }

  function test_recoverSigner_fail_InvalidSValue(bytes32 _hash, bytes32 _r, uint256 _s, uint8 _v, uint8 _type) external {
    _s = bound(_s, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A1, type(uint256).max);

    bytes memory signature = abi.encodePacked(_r, _s, _v, _type);
    vm.expectRevert(abi.encodeWithSignature('InvalidSValue(bytes,bytes32)', signature, _s));
    lib.recoverSigner(_hash, signature);
  }

  function test_recoverSigner_fail_InvalidVValue(bytes32 _hash, bytes32 _r, uint256 _s, uint8 _v, uint8 _type) external {
    _v = uint8(boundDiff(_v, 27, 28));

    _s = bound(_s, 0, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0);
    bytes memory signature = abi.encodePacked(_r, _s, _v, _type);
    vm.expectRevert(abi.encodeWithSignature('InvalidVValue(bytes,uint256)', signature, _v));
    lib.recoverSigner(_hash, signature);
  }

  function test_recoverSigner_fail_InvalidLength(bytes32 _hash, bytes calldata _signature) external {
    vm.assume(_signature.length != 66);

    vm.expectRevert(abi.encodeWithSignature('InvalidSignatureLength(bytes)', _signature));
    lib.recoverSigner(_hash, _signature);
  }

  function test_recoverSigner_fail_UnsupportedSignatureType(bytes32 _hash, bytes32 _r, uint256 _s, uint8 _v, uint8 _type) external {
    _type = uint8(boundDiff(_type, SIG_TYPE_EIP712, SIG_TYPE_ETH_SIGN));

    _s = bound(_s, 0, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0);
    _v = uint8(bound(_v, 27, 28));

    bytes memory signature = abi.encodePacked(_r, _s, _v, _type);
    vm.expectRevert(abi.encodeWithSignature('UnsupportedSignatureType(bytes,uint256,bool)', signature, _type, true));
    lib.recoverSigner(_hash, signature);
  }

  function test_recoverSigner_fail_RecoverAddressZero(bytes32 _hash, bytes32 _r, uint256 _s, uint8 _v, uint8 _type) external {
    _s = bound(_s, 0, 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0);
    _v = uint8(bound(_v, 27, 28));
    _type = uint8(bound(_type, SIG_TYPE_EIP712, SIG_TYPE_ETH_SIGN));

    bytes memory signature = abi.encodePacked(_r, _s, _v, _type);

    try lib.recoverSigner(_hash, signature) returns (address res) {
      assertTrue(res != address(0));
    } catch {}
  }

  function test_isValidSignature_EIP712(uint256 _pk, bytes32 _hash) external {
    _pk = boundPk(_pk);

    address signer = vm.addr(_pk);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(_pk, _hash);

    assertTrue(lib.isValidSignature(_hash, signer, abi.encodePacked(r, s, v, SIG_TYPE_EIP712)));
  }

  function test_isValidSignature_ETHSIGN(uint256 _pk, bytes32 _hash) external {
    _pk = boundPk(_pk);

    address signer = vm.addr(_pk);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(_pk, keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)));

    assertTrue(lib.isValidSignature(_hash, signer, abi.encodePacked(r, s, v, SIG_TYPE_ETH_SIGN)));
  }

  function test_isValidSignature_WALLET_BYTES32(address _wallet, bytes32 _hash, bytes calldata _signature) external {
    _wallet = boundNoSys(_wallet);

    bytes memory encodedSignature = abi.encodePacked(_signature, SIG_TYPE_WALLET_BYTES32);

    bytes memory expectCall = abi.encodeWithSignature('isValidSignature(bytes32,bytes)', _hash, _signature);
    bytes memory expectResult = abi.encode(bytes4(keccak256("isValidSignature(bytes32,bytes)")));

    vm.mockCall(_wallet, 0, expectCall, expectResult);
    assertTrue(lib.isValidSignature(_hash, _wallet, encodedSignature));
  }

  function test_isValidSignature_Fail_WALLET_BYTES32_BadBytes4(address _wallet, bytes32 _hash, bytes calldata _signature, bytes4 _return) external {
    vm.assume(bytes4(keccak256("isValidSignature(bytes32,bytes)")) != _return);

    _wallet = boundNoSys(_wallet);

    bytes memory encodedSignature = abi.encodePacked(_signature, SIG_TYPE_WALLET_BYTES32);
    bytes memory expectCall = abi.encodeWithSignature('isValidSignature(bytes32,bytes)', _hash, _signature);

    vm.mockCall(_wallet, 0, expectCall, abi.encode(_return));
    assertFalse(lib.isValidSignature(_hash, _wallet, encodedSignature));
  }

  function test_isValidSignature_Fail_WALLET_BYTES32_BadReturn(address _wallet, bytes32 _hash, bytes calldata _signature, bytes calldata _return) external {
    bytes memory goodReturn = abi.encode(bytes4(keccak256("isValidSignature(bytes32,bytes)")));
    vm.assume(keccak256(goodReturn) != keccak256(_return));

    bytes memory encodedSignature = abi.encodePacked(_signature, SIG_TYPE_WALLET_BYTES32);
    bytes memory expectCall = abi.encodeWithSignature('isValidSignature(bytes32,bytes)', _hash, _signature);

    bool retunedNotValid;
    vm.mockCall(_wallet, 0, expectCall, abi.encode(_return));
    try lib.isValidSignature(_hash, _wallet, encodedSignature) returns (bool isValid) {
      retunedNotValid = !isValid;
    } catch {
      retunedNotValid = true;
    }

    assertTrue(retunedNotValid);
  }

  function test_isValidSignature_Fail_EmptySignature(bytes32 _hash, address _signer) external {
    vm.expectRevert(abi.encodeWithSignature('EmptySignature()'));
    lib.isValidSignature(_hash, _signer, bytes(''));
  }

  function test_isValidSignature_Fail_UnsupportedSignatureType(bytes32 _hash, address _signer, bytes calldata _signature, uint8 _type) external {
    _type = uint8(boundDiff(_type, SIG_TYPE_EIP712, SIG_TYPE_ETH_SIGN, SIG_TYPE_WALLET_BYTES32));

    bytes memory encodedSignature = abi.encodePacked(_signature, _type);
    vm.expectRevert(abi.encodeWithSignature('UnsupportedSignatureType(bytes,uint256,bool)', encodedSignature, _type, false));
    lib.isValidSignature(_hash, _signer, encodedSignature);
  }
}

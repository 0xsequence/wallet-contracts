// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "foundry_test/base/AdvTest.sol";
import "foundry_test/base/Strings.sol";
import "foundry_test/base/Asn1Decode.sol";

import "contracts/libs/fresh_crypto/FCL_ecdsa_utils.sol";
import "contracts/libs/fresh_crypto/FCL_elliptic.sol";

import "contracts/utils/LibBytes.sol";

uint256 constant secp256r1_n = uint256(0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551);

// ecdsa signature for test purpose only (who would like to have a private key onchain anyway ?)
// K is nonce, kpriv is private key
function ecdsa_sign(bytes32 message, uint256 k, uint256 kpriv) view returns(uint256 r, uint256 s) {
  r=FCL_Elliptic_ZZ.ecZZ_mulmuladd_S_asm(0,0, k, 0); // Calculate the curve point k.G (abuse ecmulmul add with v=0)
  r=addmod(0,r, FCL_Elliptic_ZZ.n); 
  s=mulmod(FCL_Elliptic_ZZ.FCL_nModInv(k), addmod(uint256(message), mulmod(r, kpriv, FCL_Elliptic_ZZ.n),FCL_Elliptic_ZZ.n),FCL_Elliptic_ZZ.n);//s=k^-1.(h+r.kpriv)

  if(r==0||s==0){
    revert();
  }
}

// ecdsa key derivation
// kpriv is private key return (x,y) coordinates of associated Pubkey
function ecdsa_derivKpub(uint256 kpriv) view returns(uint256 x, uint256 y) {
  x=FCL_Elliptic_ZZ.ecZZ_mulmuladd_S_asm(0,0, kpriv, 0); // Calculate the curve point k.G (abuse ecmulmul add with v=0)
  y=FCL_Elliptic_ZZ.ec_Decompress(x, 1);

  if (FCL_Elliptic_ZZ.ecZZ_mulmuladd_S_asm(x, y, kpriv, FCL_Elliptic_ZZ.n - 1) != 0) { //extract correct y value{
    y=FCL_Elliptic_ZZ.p-y;
  }
}

contract FCL_ecdsaImp {
  function ecdsa_verify(bytes32 message, uint256 r, uint256 s, uint256 Qx, uint256 Qy) external view returns (bool) {
    uint256[2] memory rs;
    rs[0] = r;
    rs[1] = s;
    return FCL_ecdsaImp(address(this)).ecdsa_verify_ext(message, rs, Qx, Qy);
  }

  function ecdsa_verify_ext(bytes32 message, uint256[2] calldata rs, uint256 Qx, uint256 Qy) external view returns (bool) {
    return FCL_ecdsa_utils.ecdsa_verify(message, rs, Qx, Qy);
  }
}

contract FCL_ecdsaTest is AdvTest {
  using Strings for *;

  FCL_ecdsaImp private lib;

  constructor() {
    lib = new FCL_ecdsaImp();
  }

  function bytesToUint2(bytes memory b) internal pure returns (uint256) {
    unchecked {
      // Ignore any leading zeros
      uint256 i = 0;

      while (i < b.length && b[i] == 0) {
        i++;
      }

      // Convert bytes to uint
      uint256 result = 0;
      for (; i < b.length; i++) {
        result = result * 256 + uint256(uint8(b[i]));
      }

      return result;
    }
  }

  function parseASN1Signature(bytes memory signature) internal pure returns (uint256 r, uint256 s, bool valid) {
    unchecked {
      // Get the root node of the signature
      uint root = Asn1Decode.root(signature);

      // Get the first child of the root node (should be the 'r' value)
      uint rNode = Asn1Decode.firstChildOf(signature, root);
      bytes memory rb = Asn1Decode.uintBytesAt(signature, rNode);
      r = bytesToUint2(rb);

      // Get the next sibling of the 'r' node (should be the 's' value)
      uint sNode = Asn1Decode.nextSiblingOf(signature, rNode);
      bytes memory sb = Asn1Decode.uintBytesAt(signature, sNode);
      s = bytesToUint2(sb);

      valid = true;
    }
  }

  struct PubKey {
    uint256 x;
    uint256 y;
  }

  function readPubKey(string memory json, string memory base, string memory keyStore) internal pure returns (PubKey memory) {
    string memory swx = abi.decode(vm.parseJson(json, Strings.concat(base, keyStore, ".wx")), (string));
    string memory swy = abi.decode(vm.parseJson(json, Strings.concat(base, keyStore, ".wy")), (string));

    return PubKey(bytesToUint2(swx.parseHex()), bytesToUint2(swy.parseHex()));
  }

  struct Case {
    string comment;
    string message;
    bytes32 hashedMessage;
    string sig;
    uint256 r;
    uint256 s;
    bool valid;
    bool ignore;
    bool mustBeValid;
  }

  enum SignatureType {
    ASN1,
    P1363
  }

  function readCase(string memory json, string memory base, SignatureType sigType) internal pure returns (Case memory) {
    string memory message = abi.decode(vm.parseJson(json, Strings.concat(base, ".msg")), (string));
    string memory sig = abi.decode(vm.parseJson(json, Strings.concat(base, ".sig")), (string));
    string memory expectedResult = abi.decode(vm.parseJson(json, Strings.concat(base, ".result")), (string));
    string memory comment = abi.decode(vm.parseJson(json, Strings.concat(base, ".comment")), (string));

    uint256 r;
    uint256 s;
    bool valid;

    bytes memory sigHex = sig.parseHex();

    if (sigType == SignatureType.P1363) {
      if (sigHex.length != 64) {
        valid = false;
      } else {
        valid = true;
        (r, s) = abi.decode(sigHex, (uint256, uint256));
      }
    } else {
      (r, s, valid) = parseASN1Signature(sigHex);
    }

    bytes32 hashedMessage = sha256(message.parseHex());

    Case memory c;
    c.comment = comment;
    c.message = message;
    c.hashedMessage = hashedMessage;
    c.sig = sig;
    c.r = r;
    c.s = s;
    c.valid = valid;
    c.ignore = expectedResult.eq("acceptable");
    c.mustBeValid = expectedResult.eq("valid");
    return c;
  }

  function test_ecdsa_vectors() external {
    string memory json = vm.readFile("foundry_test/vectors/ecdsa_secp256r1_sha256_test.json");
    uint256[] memory testGroups = abi.decode(vm.parseJson(json, ".testGroups"), (uint256[]));

    uint256 total = 0;

    for (uint256 i = 0; i < testGroups.length; i++) {
      string memory base = Strings.concat(".testGroups[", vm.toString(i), "]");
      PubKey memory pub = readPubKey(json, base, ".key");

      uint256[] memory tests = abi.decode(vm.parseJson(json, Strings.concat(base, ".tests")), (uint256[]));
      for (uint256 ii = 0; ii < tests.length; ii++) {
        string memory base2 = Strings.concat(base, ".tests[", vm.toString(ii), "]");
        Case memory c = readCase(json, base2, SignatureType.ASN1);

        if (c.ignore) {
          continue;
        }

        try lib.ecdsa_verify{gas: 300000000}(c.hashedMessage, c.r, c.s, pub.x, pub.y) returns (bool result) {
          assertEq(result, c.mustBeValid, "ECDSA verification failed - ".concat(vm.toString(i), " / ", vm.toString(ii), " - ", c.comment));
        } catch {
          // If it failed then IT MUST be expected to be invalid
          assertEq(c.mustBeValid, false, "ECDSA verification failed - ".concat(vm.toString(i), " / ", vm.toString(ii), " - ", c.comment));
        }

        total++;
      }
    }

    console.log("Total test_ecdsa_vectors: ", total);
    assertNotEq(total, 0, "No ECDSA test cases were run");
  }

  function test_ecdsa_p1363_vectors() external {
    string memory json = vm.readFile("foundry_test/vectors/ecdsa_secp256r1_sha256_p1363_test.json");
    uint256[] memory testGroups = abi.decode(vm.parseJson(json, ".testGroups"), (uint256[]));

    uint256 total = 0;

    for (uint256 i = 0; i < testGroups.length; i++) {
      string memory base = Strings.concat(".testGroups[", vm.toString(i), "]");

      PubKey memory pub = readPubKey(json, base, ".publicKey");

      uint256[] memory tests = abi.decode(vm.parseJson(json, Strings.concat(base, ".tests")), (uint256[]));
      for (uint256 ii = 0; ii < tests.length; ii++) {
        string memory base2 = Strings.concat(base, ".tests[", vm.toString(ii), "]");
        Case memory c = readCase(json, base2, SignatureType.P1363);

        if (c.ignore) {
          continue;
        }

        try lib.ecdsa_verify{gas: 300000000}(c.hashedMessage, c.r, c.s, pub.x, pub.y) returns (bool result) {
          assertEq(result, c.mustBeValid, "ECDSA verification failed - ".concat(vm.toString(i), " / ", vm.toString(ii), " - ", c.comment));
        } catch {
          // If it failed then IT MUST be expected to be invalid
          assertEq(c.mustBeValid, false, "ECDSA verification failed - ".concat(vm.toString(i), " / ", vm.toString(ii), " - ", c.comment));
        }

        total++;
      }
    }

    console.log("Total test_ecdsa_p1363_vectors: ", total);
    assertNotEq(total, 0, "No ECDSA test cases were run");
  }

  function test_ecdsa_webcrypto_vectors() external {
    string memory json = vm.readFile("foundry_test/vectors/ecdsa_secp256r1_webcrypto_test.json");
    uint256[] memory testGroups = abi.decode(vm.parseJson(json, ".testGroups"), (uint256[]));

    uint256 total = 0;

    for (uint256 i = 0; i < testGroups.length; i++) {
      string memory base = Strings.concat(".testGroups[", vm.toString(i), "]");
      PubKey memory pub = readPubKey(json, base, ".publicKey");

      uint256[] memory tests = abi.decode(vm.parseJson(json, Strings.concat(base, ".tests")), (uint256[]));
      for (uint256 ii = 0; ii < tests.length; ii++) {
        string memory base2 = Strings.concat(base, ".tests[", vm.toString(ii), "]");
        Case memory c = readCase(json, base2, SignatureType.P1363);

        if (c.ignore) {
          continue;
        }

        try lib.ecdsa_verify{gas: 300000000}(c.hashedMessage, c.r, c.s, pub.x, pub.y) returns (bool result) {
          assertEq(result, c.mustBeValid, "ECDSA verification failed - ".concat(vm.toString(i), " / ", vm.toString(ii), " - ", c.comment));
        } catch {
          // If it failed then IT MUST be expected to be invalid
          assertEq(c.mustBeValid, false, "ECDSA verification failed - ".concat(vm.toString(i), " / ", vm.toString(ii), " - ", c.comment));
        }

        total++;
      }
    }

    console.log("Total test_ecdsa_webcrypto_vectors: ", total);
    assertNotEq(total, 0, "No ECDSA test cases were run");
  }

  function test_ecdsa_simple_fuzz_replicate1() external {
    bytes32 m = bytes32(0x426f756e6420526573756c742032313133343834333839353134383637363033);
    uint256 k = 30049578511147215784808879450479994853789526126808946315715484025642356310016;
    uint256 kpriv = 11579208921035624876269744694940757352999695522413576034242225906106851204436;
    test_ecdsa_simple_fuzz(m, k, kpriv);
  }

  function test_ecdsa_simple_fuzz_replicate2() external {
    bytes32 m = bytes32(0x00000000000000000000000000000000000000000000000000000000000003c9);
    uint256 k = 115792089210356248762697446949407573529996955224135760342422259061068512044369;
    uint256 kpriv = 1036;
    test_ecdsa_simple_fuzz(m, k, kpriv);
  }

  function test_ecdsa_simple_fuzz(bytes32 _message, uint256 _k, uint256 _kpriv) public {
    _k = bound(_k, 1, secp256r1_n - 1);
    _kpriv = boundPk(_kpriv, secp256r1_n);

    (uint256 r, uint256 s) = ecdsa_sign(_message, _k, _kpriv);
    (uint256 x, uint256 y) = ecdsa_derivKpub(_kpriv);

    assertTrue(lib.ecdsa_verify(_message, r, s, x, y));

    try lib.ecdsa_verify(_message, r, s, x, y + 1) returns (bool result) {
      assertFalse(result);
    } catch {}

    try lib.ecdsa_verify(_message, r, s, x + 1, y) returns (bool result) {
      assertFalse(result);
    } catch {}

    if (x != y) {
      try lib.ecdsa_verify(_message, r, s, y, x) returns (bool result) {
        assertFalse(result);
      } catch {}
    }

    if (s != r) {
      try lib.ecdsa_verify(_message, s, r, x, y) returns (bool result) {
        assertFalse(result);
      } catch {}
    }
  }

  function test_ecdsa_simple_fuzz_bad_pub(bytes32 _message, uint256 _k, uint256 _kpriv, uint256 _px, uint256 _py) external {
    _k = bound(_k, 1, secp256r1_n - 1);
    _kpriv = boundPk(_kpriv, secp256r1_n);
    
    (uint256 r, uint256 s) = ecdsa_sign(_message, _k, _kpriv);
    (uint256 x, uint256 y) = ecdsa_derivKpub(_kpriv);

    vm.assume(x != _px || y != _py);

    if (x != _px) {
      try lib.ecdsa_verify(_message, r, s, _px, y) returns (bool result) {
        assertFalse(result);
      } catch {}
    }

    if (y != _py) {
      try lib.ecdsa_verify(_message, r, s, x, _py) returns (bool result) {
        assertFalse(result);
      } catch {}
    }

    try lib.ecdsa_verify(_message, r, s, _px, _py) returns (bool result) {
      assertFalse(result);
    } catch {}

    if (x != _py && y != _px) {
      try lib.ecdsa_verify(_message, r, s, _py, _px) returns (bool result) {
        assertFalse(result);
      } catch {}
    }
  }

  function test_ecdsa_simple_fuzz_bad_msg(bytes32 _message, bytes32 _badMessage, uint256 _k, uint256 _kpriv) external {
    _k = bound(_k, 1, secp256r1_n - 1);
    _kpriv = boundPk(_kpriv, secp256r1_n);
    
    (uint256 r, uint256 s) = ecdsa_sign(_message, _k, _kpriv);
    (uint256 x, uint256 y) = ecdsa_derivKpub(_kpriv);

    vm.assume(_message != _badMessage);

    try lib.ecdsa_verify(_badMessage, r, s, x, y) returns (bool result) {
      assertFalse(result);
    } catch {}
  }

  function test_ecdsa_simple_fuzz_bad_sig(bytes32 _message, uint256 _k, uint256 _kpriv, uint256 _badr, uint256 _bads) external {
    _k = bound(_k, 1, secp256r1_n - 1);
    _kpriv = boundPk(_kpriv, secp256r1_n);
    
    (uint256 r, uint256 s) = ecdsa_sign(_message, _k, _kpriv);
    vm.assume(r != _badr || s != _bads);

    (uint256 x, uint256 y) = ecdsa_derivKpub(_kpriv);

    try lib.ecdsa_verify(_message, _badr, _bads, x, y) returns (bool result) {
      assertFalse(result);
    } catch {}

    if (r != _badr && s != _bads) {
      try lib.ecdsa_verify(_message, _bads, _badr, x, y) returns (bool result) {
        assertFalse(result);
      } catch {}
    }

    if (r != _badr) {
      try lib.ecdsa_verify(_message, _badr, s, x, y) returns (bool result) {
        assertFalse(result);
      } catch {}
    }

    if (s != _bads) {
      try lib.ecdsa_verify(_message, r, _bads, x, y) returns (bool result) {
        assertFalse(result);
      } catch {}
    }
  }
}

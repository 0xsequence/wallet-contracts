// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "foundry_test/base/AdvTest.sol";
import "foundry_test/base/Strings.sol";
import "foundry_test/base/Asn1Decode.sol";
import "foundry_test/base/predeploy/P256Deploy.sol";

import "contracts/libs/p256-verifier/P256.sol";

import "contracts/utils/LibBytes.sol";


contract FCL_ecdsaImp {
  function ecdsa_verify(bytes32 message, uint256 r, uint256 s, uint256 Qx, uint256 Qy) external view returns (bool) {
    return P256.verifySignature(message, r, s, Qx, Qy);
  }
}

contract FCL_ecdsaTest is AdvTest {
  using Strings for *;

  FCL_ecdsaImp private lib;

  constructor() {
    lib = new FCL_ecdsaImp();
    P256Deploy.mustDeployP256(address(vm));
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
}

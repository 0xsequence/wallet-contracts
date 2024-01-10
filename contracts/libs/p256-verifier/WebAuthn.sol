// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../../utils/LibString.sol";
import "./P256.sol";

/**
 * Helper library for external contracts to verify WebAuthn signatures.
 * based on p256 verifier https://github.com/daimo-eth/p256-verifier/blob/master/src/WebAuthn.sol
 * MIT License
 **/
library WebAuthn {
  bytes1 private constant AUTH_DATA_FLAGS_UP = 0x01; // Bit 0
  bytes1 private constant AUTH_DATA_FLAGS_UV = 0x04; // Bit 2
  bytes1 private constant AUTH_DATA_FLAGS_BE = 0x08; // Bit 3
  bytes1 private constant AUTH_DATA_FLAGS_BS = 0x10; // Bit 4

  /// Verifies the authFlags in authenticatorData. Numbers in inline comment
  /// correspond to the same numbered bullets in
  /// https://www.w3.org/TR/webauthn-2/#sctn-verifying-assertion.
  function checkAuthFlags(
    bytes1 flags,
    bool requireUserVerification
  ) internal pure returns (bool) {
    // 17. Verify that the UP bit of the flags in authData is set.
    if (flags & AUTH_DATA_FLAGS_UP != AUTH_DATA_FLAGS_UP) {
      return false;
    }

    // 18. If user verification was determined to be required, verify that
    // the UV bit of the flags in authData is set. Otherwise, ignore the
    // value of the UV flag.
    if (
      requireUserVerification &&
      (flags & AUTH_DATA_FLAGS_UV) != AUTH_DATA_FLAGS_UV
    ) {
      return false;
    }

    // 19. If the BE bit of the flags in authData is not set, verify that
    // the BS bit is not set.
    if (flags & AUTH_DATA_FLAGS_BE != AUTH_DATA_FLAGS_BE) {
      if (flags & AUTH_DATA_FLAGS_BS == AUTH_DATA_FLAGS_BS) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verifies a Webauthn P256 signature (Authentication Assertion) as described
   * in https://www.w3.org/TR/webauthn-2/#sctn-verifying-assertion. We do not
   * verify all the steps as described in the specification, only ones relevant
   * to our context. Please carefully read through this list before usage.
   * Specifically, we do verify the following:
   * - Verify that authenticatorData (which comes from the authenticator,
   *   such as iCloud Keychain) indicates a well-formed assertion. If
   *   requireUserVerification is set, checks that the authenticator enforced
   *   user verification. User verification should be required if,
   *   and only if, options.userVerification is set to required in the request
   * - Verifies that the client JSON is of type "webauthn.get", i.e. the client
   *   was responding to a request to assert authentication.
   * - Verifies that the client JSON contains the requested challenge.
   * - Finally, verifies that (r, s) constitute a valid signature over both
   *   the authenicatorData and client JSON, for public key (x, y).
   *
   * We make some assumptions about the particular use case of this verifier,
   * so we do NOT verify the following:
   * - Does NOT verify that the origin in the clientDataJSON matches the
   *   Relying Party's origin: It is considered the authenticator's
   *   responsibility to ensure that the user is interacting with the correct
   *   RP. This is enforced by most high quality authenticators properly,
   *   particularly the iCloud Keychain and Google Password Manager were
   *   tested.
   * - Does NOT verify That c.topOrigin is well-formed: We assume c.topOrigin
   *   would never be present, i.e. the credentials are never used in a
   *   cross-origin/iframe context. The website/app set up should disallow
   *   cross-origin usage of the credentials. This is the default behaviour for
   *   created credentials in common settings.
   * - Does NOT verify that the rpIdHash in authData is the SHA-256 hash of an
   *   RP ID expected by the Relying Party: This means that we rely on the
   *   authenticator to properly enforce credentials to be used only by the
   *   correct RP. This is generally enforced with features like Apple App Site
   *   Association and Google Asset Links. To protect from edge cases in which
   *   a previously-linked RP ID is removed from the authorised RP IDs,
   *   we recommend that messages signed by the authenticator include some
   *   expiry mechanism.
   * - Does NOT verify the credential backup state: This assumes the credential
   *   backup state is NOT used as part of Relying Party business logic or
   *   policy.
   * - Does NOT verify the values of the client extension outputs: This assumes
   *   that the Relying Party does not use client extension outputs.
   * - Does NOT verify the signature counter: Signature counters are intended
   *   to enable risk scoring for the Relying Party. This assumes risk scoring
   *   is not used as part of Relying Party business logic or policy.
   * - Does NOT verify the attestation object: This assumes that
   *   response.attestationObject is NOT present in the response, i.e. the
   *   RP does not intend to verify an attestation.
   */
  function verifySignature(
    bytes memory challenge,
    bytes memory authenticatorData,
    bool requireUserVerification,
    string memory clientDataJSON,
    uint256 challengeLocation,
    uint256 responseTypeLocation,
    uint256 r,
    uint256 s,
    uint256 x,
    uint256 y
  ) internal view returns (bool) {
    // Check that authenticatorData has good flags
    if (
      authenticatorData.length < 37 ||
      !checkAuthFlags(authenticatorData[32], requireUserVerification)
    ) {
      return false;
    }

    // Check that response is for an authentication assertion
    string memory responseType = '"type":"webauthn.get"';
    if (!LibString.contains(clientDataJSON, responseType, responseTypeLocation)) {
      return false;
    }

    // Check that challenge is in the clientDataJSON
    string memory challengeB64url = LibString.bytesToBase64URL(challenge);
    string memory challengeProperty = string.concat(
      '"challenge":"',
      challengeB64url,
      '"'
    );

    if (!LibString.contains(clientDataJSON, challengeProperty, challengeLocation)) {
      return false;
    }

    // Check that the public key signed sha256(authenticatorData || sha256(clientDataJSON))
    bytes32 clientDataJSONHash = sha256(bytes(clientDataJSON));
    bytes32 messageHash = sha256(
      abi.encodePacked(authenticatorData, clientDataJSONHash)
    );

    return P256.verifySignature(messageHash, r, s, x, y);
  }
}

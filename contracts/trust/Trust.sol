// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "../interfaces/IERC1271Wallet.sol";
import "../utils/SignatureValidator.sol";

function absDiff(uint256 a, uint256 b) pure returns (bool, uint256) {
  if (a > b) {
    return (true, a - b);
  }

  return (false, b - a);
}

contract Trust is IERC1271Wallet {
  error UnlockInThePast(uint256 _unlocksAt, uint256 _elapsed);
  error UnlockTooEarly(uint256 _unlocksAt, uint256 _diff);

  error NotOwner(address _sender);
  error NotUnlocked(uint256 _unlocksAt);
  error FailedTransaction(address payable _to, uint256 _value, bytes _data, bytes _result);

  error EmptySignature();
  error InvalidSignatureFlag(bytes _signature, bytes1 _flag);
  error InvalidSignature(bytes32 _hash, bytes32 _rehash, address _signer, bytes _signature);

  event SetUnlocksAt(uint256 _unlocksAt);
  event SentTransaction(address payable _to, uint256 _value, bytes _data, bytes _result);

  address immutable public owner;
  address immutable public beneficiary;
  uint256 immutable public duration;

  uint256 public unlocksAt = type(uint256).max;

  constructor (
    address _owner,
    address _beneficiary,
    uint256 _duration
  ) {
    owner = _owner;
    beneficiary = _beneficiary;
    duration = _duration;
  }

  modifier onlyAllowed() {
    if (msg.sender != owner) {
      if (msg.sender != beneficiary) {
        revert NotOwner(msg.sender);
      }

      if (isLocked()) {
        revert NotUnlocked(unlocksAt);
      }
    }

    _;
  }

  modifier onlyMember() {
    if (msg.sender != owner && msg.sender != beneficiary) {
      revert NotOwner(msg.sender);
    }

    _;
  }

  function isLocked() public view returns (bool) {
    return block.timestamp < unlocksAt;
  }

  function setUnlocksAt(uint256 _unlocksAt) external onlyMember {
    // Diff between the current time and the unlock time must be
    // greater than the duration of the trust
    (bool isPast, uint256 elapsed) = absDiff(block.timestamp, _unlocksAt);
    if (isPast) {
      revert UnlockInThePast(_unlocksAt, elapsed);
    }

    if (elapsed < duration) {
      revert UnlockTooEarly(_unlocksAt, elapsed);
    }

    emit SetUnlocksAt(_unlocksAt);
    unlocksAt = _unlocksAt;
  }

  function sendTransaction(
    address payable _to,
    uint256 _value,
    bytes calldata _data
  ) external onlyAllowed returns (bytes memory) {
    (bool success, bytes memory result) = _to.call{value: _value}(_data);

    if (!success) {
      revert FailedTransaction(_to, _value, _data, result);
    }

    emit SentTransaction(_to, _value, _data, result);
    return result;
  }

  bytes4 internal constant SELECTOR_ERC1271_BYTES_BYTES = 0x20c13b0b;
  bytes4 internal constant SELECTOR_ERC1271_BYTES32_BYTES = 0x1626ba7e;

  function isValidSignature(
    bytes calldata _data,
    bytes calldata _signature
  ) external view returns (bytes4) {
    bytes4 res = Trust(payable(address((this)))).isValidSignature(
      keccak256(_data),
      _signature
    );

    assert(res == SELECTOR_ERC1271_BYTES32_BYTES);
    return SELECTOR_ERC1271_BYTES_BYTES;
  }

  function isValidSignature(
    bytes32 _hash,
    bytes calldata _signature
  ) external view returns (bytes4) {
    if (_signature.length == 0) {
      revert EmptySignature();
    }

    // If last byte is 0x00 we use the owner
    // if 0x01 we use the beneficiary
    address signer;

    if (_signature[_signature.length - 1] == 0x00) {
      signer = owner;
    } else if (_signature[_signature.length - 1] == 0x01) {
      signer = beneficiary;
    } else {
      revert InvalidSignatureFlag(_signature, _signature[_signature.length - 1]);
    }

    if (signer != owner && isLocked()) {
      revert NotUnlocked(unlocksAt);
    }

    // Re-hash the hash adding the address of the trust
    // otherwise the signature will be valid for any trust
    bytes32 rehash = keccak256(abi.encodePacked(address(this), _hash));

    // Validate the signature
    if (!SignatureValidator.isValidSignature(rehash, signer, _signature[0:_signature.length - 1])) {
      revert InvalidSignature(_hash, rehash, signer, _signature[0:_signature.length - 1]);
    }

    return SELECTOR_ERC1271_BYTES32_BYTES;
  }

  receive() external payable {}
  fallback() external payable {}
}

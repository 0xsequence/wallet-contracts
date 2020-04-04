pragma solidity ^0.6.4;
pragma experimental ABIEncoderV2;

import "../utils/SignatureValidator.sol";
import "./commons/Implementation.sol";

import "../interfaces/receivers/IERC1155Receiver.sol";
import "../interfaces/receivers/IERC721Receiver.sol";

import "../interfaces/IERC1271Wallet.sol";


/**
 * To do
 *   - Recovery
 *   - Force module only
 *   - private vs internal
 *   - Public vs External for main module
 */
contract MainModule is
  Implementation,
  SignatureValidator,
  IERC1271Wallet,
  IERC1155Receiver,
  IERC721Receiver
{
  mapping(bytes4 => address) public hooks;
  mapping(address => bool) public modules;

  /***********************************|
  |             Constants             |
  |__________________________________*/

  // Could be ENUM
  enum Action {
    Illegal,      // 0x00 Default value
    Delegate,     // Delegate call
    External,     // External call
    AddModule,    // Adding a module
    RemoveModule, // Removing a module
    AddHook,      // Adding a hook
    RemoveHook,   // Removing a hook
    UpdateImp,    // Replaces the main implementation
    NActionTypes  // Number of valid actions
  }

  // keccak256("placeholder-init-code-hash")
  bytes32 public constant INIT_CODE_HASH = 0xa4e481c95834a9f994a80cd4ecc88bdd3e78ff54100ecf2903aa9ef3eed54a91;

  // keccak256("placeholder-factory")[12:]
  address public constant FACTORY = address(0x52AA901CAD8AFf3Cf157715c19632F79D9B2d049);

  /***********************************|
  |             Variables             |
  |__________________________________*/

  uint256 public nonce = 0;

  /***********************************|
  |               Events              |
  |__________________________________*/

  event NonceChange(uint256 newNonce);

  event TxFailed(uint256 _index, bytes _reason);

  /***********************************|
  |              Structs              |
  |__________________________________*/

  struct Transaction {
    Action action;     // Action to use for the transaction
    bool skipOnError;  // Ignored upon failure
    address target;    // Address of the contract to call
    uint256 value;     // Amount of ETH to pass with the call
    bytes data;        // calldata to pass
  }

  /***********************************|
  |     Authentication Functions      |
  |__________________________________*/

  /**
   * @notice Verify if signer is default wallet owner
   * @param _hash Hashed signed message
   * @param _signature Encoded signature
   *       (bytes32 r, bytes32 s, uint8 v, SignatureType sigType)
   * @return True is the signature is valid
   */
  function _signatureValidation(bytes32 _hash, bytes memory _signature)
    private view returns (bool)
  {
    // Retrieve the signer
    address signer = recoverSigner(_hash, _signature);

    // Verifier if wallet was created for signer
    address candidate = address(uint256(keccak256(abi.encodePacked(byte(0xff), FACTORY, bytes32(uint256(signer)), INIT_CODE_HASH))));
    return candidate == address(this);
  }

  /**
   * @notice Verify if a nonce is valid
   * @param _nonce Nonce to validate
   * @dev A valid nonce must be above the last one used
   *   with a maximum delta of 100
   */
  function _validateNonce(uint256 _nonce) private {
    // Retrieve current nonce for this wallet
    uint256 current_nonce = nonce; // Lowest valid nonce for signer

    // Verify if nonce is valid
    require(
      (_nonce >= current_nonce) && (_nonce < (current_nonce + 100)),
      "MainModule#_auth: INVALID_NONCE"
    );

    // Update signature nonce
    nonce = _nonce + 1;
    emit NonceChange(_nonce + 1);
  }

  /**
   * @notice Hashed _data to be signed
   * @param _data Data to be hashed
   * @return hashed data for this wallet
   *   keccak256(abi.encode(wallet, _data))
   */
  function _hashData(bytes memory _data) private view returns (bytes32) {
    return keccak256(abi.encode(address(this), _data));
  }

  /***********************************|
  |      Tx Execution Functions       |
  |__________________________________*/

  /**
   * @notice Allow wallet owner to execute an action
   * @param _txs        Transactions to process
   * @param _nonce      Signature nonce
   * @param _signature  Encoded signature
   */
  function execute(Transaction[] memory _txs, uint256 _nonce, bytes memory _signature)
    public
  {
    // Validate and update nonce
    _validateNonce(_nonce);

    // Check if signature is valid
    require(
      _signatureValidation(_hashData(abi.encode(_nonce, _txs)), _signature),
      "MainModule#_signatureValidation: INVALID_SIGNATURE"
    );

    for (uint256 i = 0; i < _txs.length; i++) {
      // Execute every transaction
      _actionExecution(_txs[i], i);
    }
  }

  /**
   * @notice Logs a failed transaction, reverts if the transaction is not optional
   * @param _tx      Transaction that is reverting
   * @param _index   Index of transaction in batch
   * @param _reason  Revert message
   */
  function _revert(Transaction memory _tx, uint256 _index, string memory _reason) internal {
    // Encoded like a call to a `Error(string)` function, as defined
    // by the Solidity 0.6.0 documentation
    // Ref: https://solidity.readthedocs.io/en/v0.6.0/control-structures.html#id4
    _revertBytes(_tx, _index, abi.encodeWithSelector(0x08c379a0, _reason));
  }

  /**
   * @notice Logs a failed transaction, reverts if the transaction is not optional
   * @param _tx      Transaction that is reverting
   * @param _index   Index of transaction in batch
   * @param _reason  Encoded revert message
   */
  function _revertBytes(Transaction memory _tx, uint256 _index, bytes memory _reason) internal {
    if (_tx.skipOnError) {
      emit TxFailed(_index, _reason);
    } else {
      assembly { revert(add(_reason, 0x20), mload(_reason)) }
    }
  }

  /**
   * @notice Allow wallet owner to execute an action
   * @param _tx     Transaction to process
   * @param _index  Index of transaction in batch
   */
  function _actionExecution(Transaction memory _tx, uint256 _index)
    internal
  {
    // Performs an external call
    if (_tx.action == Action.External) {
      // solium-disable-next-line security/no-call-value
      (bool success, bytes memory result) = _tx.target.call.value(_tx.value)(_tx.data);
      if (!success) _revertBytes(_tx, _index, result);

    // Delegates a call to a provided implementation
    } else if (_tx.action == Action.Delegate) {
      (bool success, bytes memory result) = _tx.target.delegatecall(_tx.data);
      if (!success) _revertBytes(_tx, _index, result);

    // Adds a new module to the wallet
    } else if (_tx.action == Action.AddModule) {
      if (!modules[_tx.target]) {
        modules[_tx.target] = true;
      } else {
        _revert(_tx, _index, "MainModule#_actionExecution: MODULE_ALREADY_REGISTERED");
      }

    // Adds a new module to the wallet
    } else if (_tx.action == Action.RemoveModule) {
      if (modules[_tx.target]) {
        modules[_tx.target] = false;
      } else {
        _revert(_tx, _index, "MainModule#_actionExecution: MODULE_NOT_REGISTERED");
      }

    // Adds a new hook to the wallet
    } else if (_tx.action == Action.AddHook) {
      bytes4 hook_signature = abi.decode(_tx.data, (bytes4));
      if (hooks[hook_signature] == address(0x0)) {
        hooks[hook_signature] = _tx.target;
      } else {
        _revert(_tx, _index, "MainModule#_actionExecution: HOOK_ALREADY_REGISTERED");
      }

    // Remove a hook from the wallet
    } else if (_tx.action == Action.RemoveHook) {
      bytes4 hook_signature = abi.decode(_tx.data, (bytes4));
      if (hooks[hook_signature] != address(0x0)){
        hooks[hook_signature] = _tx.target;
      } else {
        _revert(_tx, _index, "MainModule#_actionExecution: HOOK_NOT_REGISTERED");
      }

    // Update wallet implementation
    } else if (_tx.action == Action.UpdateImp) {
      address new_implementation = abi.decode(_tx.data, (address));
      if (new_implementation != address(0x0)) {
        _setImplementation(new_implementation);
      } else {
        _revert(_tx, _index, "MainModule#_actionExecution: INVALID_IMPLEMENTATION");
      }
    } else {
      _revert(_tx, _index, "MainModule#_actionExecution: INVALID_ACTION");
    }
  }

  /***********************************|
  |           Default hooks           |
  |__________________________________*/

  /**
   * @notice Handle the receipt of a single ERC1155 token type.
   * @return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
   */
  function onERC1155Received(
    address,
    address,
    uint256,
    uint256,
    bytes calldata
  ) external override returns (bytes4) {
    return MainModule.onERC1155Received.selector;
  }

  /**
   * @notice Handle the receipt of multiple ERC1155 token types.
   * @return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
   */
  function onERC1155BatchReceived(
    address,
    address,
    uint256[] calldata,
    uint256[] calldata,
    bytes calldata
  ) external override returns (bytes4) {
    return MainModule.onERC1155BatchReceived.selector;
  }

  /**
   * @notice Handle the receipt of a single ERC721 token.
   * @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
   */
  function onERC721Received(address, address, uint256, bytes calldata) external override returns (bytes4) {
    return MainModule.onERC721Received.selector;
  }

  /**
   * @notice Verifies whether the provided signature is valid with respect to the provided data
   * @dev MUST return the correct magic value if the signature provided is valid for the provided data
   *   > The bytes4 magic value to return when signature is valid is 0x20c13b0b : bytes4(keccak256("isValidSignature(bytes,bytes)")
   * @param _data       Arbitrary length data signed on the behalf of address(this)
   * @param _signature  Signature byte array associated with _data
   * @return magicValue Magic value 0x20c13b0b if the signature is valid and 0x0 otherwise
   */
  function isValidSignature(
    bytes calldata _data,
    bytes calldata _signature
  ) external override view returns (bytes4) {
    if (_signatureValidation(_hashData(_data), _signature)) {
      // bytes4(keccak256("isValidSignature(bytes,bytes)")
      return 0x20c13b0b;
    }
  }

  /**
   * @notice Verifies whether the provided signature is valid with respect to the provided hash
   * @dev MUST return the correct magic value if the signature provided is valid for the provided hash
   *   > The bytes4 magic value to return when signature is valid is 0x20c13b0b : bytes4(keccak256("isValidSignature(bytes,bytes)")
   * @param _hash       keccak256 hash that was signed
   * @param _signature  Signature byte array associated with _data
   * @return magicValue Magic value 0x20c13b0b if the signature is valid and 0x0 otherwise
   */
  function isValidSignature(
    bytes32 _hash,
    bytes calldata _signature
  ) external override view returns (bytes4) {
    if (_signatureValidation(_hash, _signature)) {
      // bytes4(keccak256("isValidSignature(bytes,bytes)")
      return 0x20c13b0b;
    }
  }

  /* solhint-disable */

  /**
   * @notice Routes fallback calls through hooks
   */
  fallback() external payable {
    address target = hooks[msg.sig];
    if (target != address(0)) {
      (bool success, bytes memory result) = target.delegatecall(msg.data);
      assembly {
        if iszero(success)  {
          revert(add(result, 0x20), mload(result))
        }

        return(add(result, 0x20), mload(result))
      }
    }
  }

  /**
   * @notice Allows the wallet to receive ETH
   */
  receive() external payable { }

  /* solhint-enable */
}

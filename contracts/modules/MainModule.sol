pragma solidity ^0.6.4;

import "../utils/SignatureValidator.sol";

/**
 * To do
 *   - Recovery
 *   - nonce logic
 *  - Force module only
 *   - Gas limit logic ? Feels like wrapper contract could choose limit
 *   - private vs internal
 *   - Public vs External for main module
 */
contract MainModule is SignatureValidator {
  mapping(address => bool) internal modules;

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

  /***********************************|
  |              Structs              |
  |__________________________________*/

  struct Transaction {
    Action action;  // Action to use for the transaction
    address target; // Address of the contract to call
    uint256 value;  // Amount of ETH to pass with the call
    bytes data;     // calldata to pass
  }

  /***********************************|
  |     Authentication Functions      |
  |__________________________________*/

  /**
   * @notice Verify if signer is default wallet owner
   * @param _data Bytes array the user hashed and signed
   * @param _signature Encoded signature
   *       (bytes32 r, bytes32 s, uint8 v, uint256 nonce, SignatureType sigType)
   */
  function _signatureValidation(bytes memory _data, bytes memory _signature)
    private returns (bool)
  {
    // Need to check security here, seems to force modules to check signature auth
    if (msg.sender == address(this)) return true;

    // Retrieve current nonce for this wallet
    uint256 current_nonce = nonce; // Lowest valid nonce for signer
    uint256 signed_nonce = uint256(_signature.readBytes32(65));  // Nonce passed in the signature object

    // Verify if nonce is valid
    require(
      (signed_nonce >= current_nonce) && (signed_nonce < (current_nonce + 100)),
      "MainModule#_auth: INVALID_NONCE"
    );

    // Update signature nonce
    nonce = current_nonce + 1;
    emit NonceChange(current_nonce + 1);

    // Retrieve the signer
    bytes32 tx_hash = keccak256(abi.encode(address(this), signed_nonce, _data));
    address signer = recoverSigner(tx_hash, _signature);

    // Verifier if wallet was created for signer
    address candidate = address(uint256(keccak256(abi.encodePacked(byte(0xff), FACTORY, bytes32(uint256(signer)), INIT_CODE_HASH))));
    require(candidate == address(this), "MainModule#_signatureValidation: INVALID_SIGNATURE");
    return true;
  }

  /**
   * @notice Verify if contract target is a registered module
   * @param _target Contract to call
   */
  function _verifyTargetIsModule(address _target) internal {
    require(modules[_target], "MainModul:onlyModule# TARGET_IS_NOT_APPROVED_MODULE");
  }


  /***********************************|
  |      Tx Execution Functions       |
  |__________________________________*/

  /**
   * @notice Allow wallet owner to execute an action
   * @param _tx        Transaction to process
   * @param _signature Encoded signature
   */
  function execute(Transaction memory _tx, bytes memory _signature)
    public
  {
    // Check if signature is valid and update nonce
    _signatureValidation(abi.encode(_tx), _signature);

    // Execute transaction
    _actionExecution(_tx);
  }

  /**
   * @notice Allow wallet owner to execute an action
   * @dev Relayer *needs* to verify if _gasPaymentTx is sufficient
   * @param _tx           Transaction to process
   * @param _gasPaymentTx Transaction that will be executed to reimburse gas
   * @param _signature    Encoded signature
   */
  function executeWithFee(Transaction memory _tx, Transaction memory _gasPaymentTx, bytes memory _signature)
    public
  {
    // Check if signature is valid and update nonce
    _signatureValidation(abi.encode(_tx, _gasPaymentTx), _signature);

    // Execute transaction
    _actionExecution(_tx);

    // Execute fee payment transaction
    _actionExecution(_gasPaymentTx);
  }

  /**
   * @notice Allow wallet owner to execute an action
   * @param _tx Transaction to process
   */
  function _actionExecution(Transaction memory _tx)
    internal
  {
    if (_tx.action == Action.External) {
      // Performs an external call
      // solium-disable-next-line security/no-call-value
      (bool success, bytes memory result) = _tx.target.call.value(_tx.value)(_tx.data);
      require(success, string(result));

    } else if (_tx.action == Action.Delegate) {
      // Verify if module is enabled
      _verifyTargetIsModule(_tx.target);

      // Delegates a call to a provided implementation
      (bool success, bytes memory result) = _tx.target.delegatecall(_tx.data);
      require(success, string(result));

    } else if (_tx.action == Action.AddModule) {
      // Adds a new module to the wallet, reverts if selector is being used
      require(modules[_tx.target], "MainModule#_actionExecution: MODULE_ALREADY_REGISTERED");
      modules[_tx.target] = true;

    } else if (_tx.action == Action.RemoveModule) {
      // Adds a new module to the wallet, reverts if selector is being used
      require(modules[_tx.target], "MainModule#_actionExecution: MODULE_NOT_REGISTERED");
      modules[_tx.target] = false;


    } else {
      revert("MainModule#_actionExecution: INVALID_ACTION");
    }
  }

}

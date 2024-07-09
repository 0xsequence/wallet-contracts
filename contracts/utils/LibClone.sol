// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @notice Minimal proxy library.
/// @author Solady (https://github.com/vectorized/solady/blob/main/src/utils/LibClone.sol)
/// @author Minimal proxy by 0age (https://github.com/0age)
/// @author Clones with immutable args by wighawag, zefram.eth, Saw-mon & Natalie
/// (https://github.com/Saw-mon-and-Natalie/clones-with-immutable-args)
/// @author Minimal ERC1967 proxy by jtriley-eth (https://github.com/jtriley-eth/minimum-viable-proxy)
///
/// @dev Minimal proxy:
/// Although the sw0nt pattern saves 5 gas over the erc-1167 pattern during runtime,
/// it is not supported out-of-the-box on Etherscan. Hence, we choose to use the 0age pattern,
/// which saves 4 gas over the erc-1167 pattern during runtime, and has the smallest bytecode.
//
library LibClone {

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*             CUSTOM ERRORS                                  */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @dev Unable to deploy the clone.
  error DeploymentFailed();

  /// @dev The salt must start with either the zero address or `by`.
  error SaltDoesNotStartWith();

  /// @dev The ETH transfer has failed.
  error ETHTransferFailed();

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*          MINIMAL PROXY OPERATIONS                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @dev Deploys a clone of `implementation`.
  function clone(address implementation) internal returns (address instance) {
    instance = clone(0, implementation);
  }

  /// @dev Deploys a clone of `implementation`.
  /// Deposits `value` ETH during deployment.
  function clone(uint256 value, address implementation) internal returns (address instance) {
    /// @solidity memory-safe-assembly
    assembly {
    /**
      * --------------------------------------------------------------------------+
      * CREATION (9 bytes)                                                        |
      * --------------------------------------------------------------------------|
      * Opcode     | Mnemonic          | Stack     | Memory                       |
      * --------------------------------------------------------------------------|
      * 60 runSize | PUSH1 runSize     | r         |                              |
      * 3d         | RETURNDATASIZE    | 0 r       |                              |
      * 81         | DUP2              | r 0 r     |                              |
      * 60 offset  | PUSH1 offset      | o r 0 r   |                              |
      * 3d         | RETURNDATASIZE    | 0 o r 0 r |                              |
      * 39         | CODECOPY          | 0 r       | [0..runSize): runtime code   |
      * f3         | RETURN            |           | [0..runSize): runtime code   |
      * --------------------------------------------------------------------------|
      * RUNTIME (44 bytes)                                                        |
      * --------------------------------------------------------------------------|
      * Opcode  | Mnemonic       | Stack                  | Memory                |
      * --------------------------------------------------------------------------|
      *                                                                           |
      * ::: keep some values in stack ::::::::::::::::::::::::::::::::::::::::::: |
      * 3d      | RETURNDATASIZE | 0                      |                       |
      * 3d      | RETURNDATASIZE | 0 0                    |                       |
      * 3d      | RETURNDATASIZE | 0 0 0                  |                       |
      * 3d      | RETURNDATASIZE | 0 0 0 0                |                       |
      *                                                                           |
      * ::: copy calldata to memory ::::::::::::::::::::::::::::::::::::::::::::: |
      * 36      | CALLDATASIZE   | cds 0 0 0 0            |                       |
      * 3d      | RETURNDATASIZE | 0 cds 0 0 0 0          |                       |
      * 3d      | RETURNDATASIZE | 0 0 cds 0 0 0 0        |                       |
      * 37      | CALLDATACOPY   | 0 0 0 0                | [0..cds): calldata    |
      *                                                                           |
      * ::: delegate call to the implementation contract :::::::::::::::::::::::: |
      * 36      | CALLDATASIZE   | cds 0 0 0 0            | [0..cds): calldata    |
      * 3d      | RETURNDATASIZE | 0 cds 0 0 0 0          | [0..cds): calldata    |
      * 73 addr | PUSH20 addr    | addr 0 cds 0 0 0 0     | [0..cds): calldata    |
      * 5a      | GAS            | gas addr 0 cds 0 0 0 0 | [0..cds): calldata    |
      * f4      | DELEGATECALL   | success 0 0            | [0..cds): calldata    |
      *                                                                           |
      * ::: copy return data to memory :::::::::::::::::::::::::::::::::::::::::: |
      * 3d      | RETURNDATASIZE | rds success 0 0        | [0..cds): calldata    |
      * 3d      | RETURNDATASIZE | rds rds success 0 0    | [0..cds): calldata    |
      * 93      | SWAP4          | 0 rds success 0 rds    | [0..cds): calldata    |
      * 80      | DUP1           | 0 0 rds success 0 rds  | [0..cds): calldata    |
      * 3e      | RETURNDATACOPY | success 0 rds          | [0..rds): returndata  |
      *                                                                           |
      * 60 0x2a | PUSH1 0x2a     | 0x2a success 0 rds     | [0..rds): returndata  |
      * 57      | JUMPI          | 0 rds                  | [0..rds): returndata  |
      *                                                                           |
      * ::: revert :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: |
      * fd      | REVERT         |                        | [0..rds): returndata  |
      *                                                                           |
      * ::: return :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: |
      * 5b      | JUMPDEST       | 0 rds                  | [0..rds): returndata  |
      * f3      | RETURN         |                        | [0..rds): returndata  |
      * --------------------------------------------------------------------------+
      */
      mstore(0x21, 0x5af43d3d93803e602a57fd5bf3)
      mstore(0x14, implementation)
      mstore(0x00, 0x602c3d8160093d39f33d3d3d3d363d3d37363d73)
      instance := create(value, 0x0c, 0x35)
      if iszero(instance) {
        mstore(0x00, 0x30116425) // `DeploymentFailed()`.
        revert(0x1c, 0x04)
      }
      mstore(0x21, 0) // Restore the overwritten part of the free memory pointer.
    }
  }

  /// @dev Deploys a deterministic clone of `implementation` with `salt`.
  function cloneDeterministic(address implementation, bytes32 salt)
    internal
    returns (address instance)
  {
    instance = cloneDeterministic(0, implementation, salt);
  }

  /// @dev Deploys a deterministic clone of `implementation` with `salt`.
  /// Deposits `value` ETH during deployment.
  function cloneDeterministic(uint256 value, address implementation, bytes32 salt)
    internal
    returns (address instance)
  {
    /// @solidity memory-safe-assembly
    assembly {
      mstore(0x21, 0x5af43d3d93803e602a57fd5bf3)
      mstore(0x14, implementation)
      mstore(0x00, 0x602c3d8160093d39f33d3d3d3d363d3d37363d73)
      instance := create2(value, 0x0c, 0x35, salt)
      if iszero(instance) {
        mstore(0x00, 0x30116425) // `DeploymentFailed()`.
        revert(0x1c, 0x04)
      }
      mstore(0x21, 0) // Restore the overwritten part of the free memory pointer.
    }
  }

  /// @dev Returns the initialization code of the clone of `implementation`.
  function initCode(address implementation) internal pure returns (bytes memory result) {
    /// @solidity memory-safe-assembly
    assembly {
      result := mload(0x40)
      mstore(add(result, 0x40), 0x5af43d3d93803e602a57fd5bf30000000000000000000000)
      mstore(add(result, 0x28), implementation)
      mstore(add(result, 0x14), 0x602c3d8160093d39f33d3d3d3d363d3d37363d73)
      mstore(result, 0x35) // Store the length.
      mstore(0x40, add(result, 0x60)) // Allocate memory.
    }
  }

  /// @dev Returns the initialization code hash of the clone of `implementation`.
  /// Used for mining vanity addresses with create2crunch.
  function initCodeHash(address implementation) internal pure returns (bytes32 hash) {
    /// @solidity memory-safe-assembly
    assembly {
      mstore(0x21, 0x5af43d3d93803e602a57fd5bf3)
      mstore(0x14, implementation)
      mstore(0x00, 0x602c3d8160093d39f33d3d3d3d363d3d37363d73)
      hash := keccak256(0x0c, 0x35)
      mstore(0x21, 0) // Restore the overwritten part of the free memory pointer.
    }
  }

  /// @dev Returns the address of the deterministic clone of `implementation`,
  /// with `salt` by `deployer`.
  /// Note: The returned result has dirty upper 96 bits. Please clean if used in assembly.
  function predictDeterministicAddress(address implementation, bytes32 salt, address deployer)
    internal
    pure
    returns (address predicted)
  {
    bytes32 hash = initCodeHash(implementation);
    predicted = predictDeterministicAddress(hash, salt, deployer);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*            OTHER OPERATIONS                                */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @dev Returns the address when a contract with initialization code hash,
  /// `hash`, is deployed with `salt`, by `deployer`.
  /// Note: The returned result has dirty upper 96 bits. Please clean if used in assembly.
  function predictDeterministicAddress(bytes32 hash, bytes32 salt, address deployer)
    internal
    pure
    returns (address predicted)
  {
    /// @solidity memory-safe-assembly
    assembly {
      // Compute and store the bytecode hash.
      mstore8(0x00, 0xff) // Write the prefix.
      mstore(0x35, hash)
      mstore(0x01, shl(96, deployer))
      mstore(0x15, salt)
      predicted := keccak256(0x00, 0x55)
      mstore(0x35, 0) // Restore the overwritten part of the free memory pointer.
    }
  }
}
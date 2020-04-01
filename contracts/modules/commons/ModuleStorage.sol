pragma solidity ^0.6.4;
pragma experimental ABIEncoderV2;

/**
    All wallet modules MUST inherit from this contract, the wallet reserves
    the storage slot 0 for storing the MainModule implementation; writting
    to it may brick the wallet.
*/
contract ModuleStorage {
  // The storage slot 0 is reserved and
  // used to store the current wallet implementation
  address internal implementation;
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.16;


interface IERC173 {
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
  function owner() view external returns(address);
  function transferOwnership(address _newOwner) external;	
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import "./ModuleIPFS.sol";

import "../../utils/LibString.sol";


contract ModuleERC5719 is ModuleIPFS {
  function getAlternativeSignature(bytes32 _digest) external view returns (string memory) {
    return string(
      abi.encodePacked(
        ipfsRoot(),
        "/ERC5719/",
        LibString.prefixHexadecimal(
          LibString.bytesToHexadecimal(
            abi.encodePacked(_digest)
          )
        )
      )
    );
  }
}

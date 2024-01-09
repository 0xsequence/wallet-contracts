// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;


interface CanEtch {
  function etch(address _a, bytes memory _code) external;
}

library CREATE2Deploy {
  address internal constant FACTORY_ADDRESS = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

  bytes internal constant DEPLOYER_CODE = hex"7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3";

  function mustDeployFactory(address _vm) internal {
    if (FACTORY_ADDRESS.code.length > 0) {
      return;
    }

    CanEtch(_vm).etch(FACTORY_ADDRESS, DEPLOYER_CODE);
    require(FACTORY_ADDRESS.code.length > 0, "CREATE2Deploy: failed to deploy factory - no code");
  }
}

pragma solidity ^0.6.8;


contract GasBurnerMock {
  event ProvidedGas(uint256 _val);

  function burnGas(uint256 _burn) external {
    emit ProvidedGas(gasleft());

    bytes32 stub;
    uint256 initial = gasleft();

    while (initial - gasleft() < _burn) {
      stub = keccak256(abi.encode(stub));
    }
  }
}

import { BigNumberish, BytesLike, ethers } from "ethers"
import { CHAIN_ID } from "."

export const WALLET_CODE = '0x603a600e3d39601a805130553df3363d3d373d3d3d363d30545af43d82803e903d91601857fd5bf3'

export enum SignatureType {
  Legacy = 0,
  Dynamic = 1,
  NoChaindDynamic = 2,
}

export type WalletConfig = {
  threshold: BigNumberish,
  signers: {
    weight: BigNumberish
    address: string
  }[]
}

export type Transaction = {
  delegateCall: boolean;
  revertOnError: boolean;
  gasLimit: BigNumberish;
  target: string;
  value: BigNumberish;
  data: BytesLike;
}

export enum SignaturePartType {
  Signature = 3,
  Address = 1,
  Dynamic = 2,
  Leaf = 0,
}

export type SignaturePart = {
  address: string;
  type: SignaturePartType; 
  signature?: string;
}


export function applyTxDefault(
  tx: Partial<Transaction>,
  def: Transaction = {
    delegateCall: false,
    revertOnError: true,
    gasLimit: 0,
    target: '0xFb8356E7deB64034aBE2b2a8A732634f77A2DAE4', // Random address
    value: 0,
    data: []
  }
): Transaction {
  return {
    ...def,
    ...tx,
  }
}

export function applyTxDefaults(
  tx: Partial<Transaction>[],
  def?: Transaction
): Transaction[] {
  return tx.map(t => applyTxDefault(t, def))
}

export const MetaTransactionsSolidityType = `tuple(
  bool delegateCall,
  bool revertOnError,
  uint256 gasLimit,
  address target,
  uint256 value,
  bytes data
)[]`

export function addressOf(factory: string, firstModule: string, imageHash: string): string {
  const codeHash = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ['bytes', 'bytes32'],
      [WALLET_CODE, ethers.utils.hexZeroPad(firstModule, 32)]
    )
  )

  const hash = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ['bytes1', 'address', 'bytes32', 'bytes32'],
      ['0xff', factory, imageHash, codeHash]
    )
  )

  return ethers.utils.getAddress(ethers.utils.hexDataSlice(hash, 12))
}

export function encodeNonce(space: BigNumberish, nonce: BigNumberish, type: ethers.BigNumberish = 0) {
  return ethers.BigNumber.from(ethers.utils.solidityPack(['uint160', 'uint8', 'uint88'], [space, type, nonce]))
}

export function joinAddrAndWeight(address: string, weight: BigNumberish) {
  return ethers.utils.solidityPack(
    ['uint96', 'address'],
    [weight, address]
  )
}

export function imageHash(config: WalletConfig): string {
  // Build leafs
  const leafs = config.signers.map(s => joinAddrAndWeight(s.address, s.weight))

  // Hash tree to get root
  for (let i = leafs.length; i > 1; i /= 2) {
    for (let j = 0; j < i / 2; j++) {
      if ((j * 2 + 1) >= i) {
        leafs[j] = leafs[j * 2]
      } else {
        leafs[j] = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes32', 'bytes32'],
            [leafs[j * 2], leafs[j * 2 + 1]]
          )
        )
      }
    }
  }

  // imageHash is threshold + merkle root
  return ethers.utils.keccak256(ethers.utils.solidityPack(['uint256', 'bytes32'], [config.threshold, leafs[0]]))
}

export function digestOf(txs: Partial<Transaction>[], nonce: ethers.BigNumberish) {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['uint256', MetaTransactionsSolidityType],
      [nonce, applyTxDefaults(txs)]
    )
  )
}

export function subDigestOf(wallet: string, digest: ethers.BytesLike, chainId: ethers.BigNumberish = CHAIN_ID()) {
  return ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ['string', 'uint256', 'address', 'bytes32'],
      ['\x19\x01', chainId, wallet, digest]
    )
  )
}

export function computeStorageKey(key: string, subkey?: string): string {
  if (!subkey) {
    return ethers.utils.id(key)
  }

  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes32'],
      [computeStorageKey(key), subkey]
    )
  )
}

export type EncodingOptions = {
  forceDynamicEncoding?: boolean,
  signatureType?: SignatureType,
}

export function encodeSignature(
    config: WalletConfig,
    parts: SignaturePart[],
    options?: EncodingOptions
  ) {
  let partsEncoded: {
    address: string,
    weight: BigNumberish,
    encoded: string,
    isSignature: boolean
  }[] = []

  for (const signer of config.signers) {
    const found = parts.find((p) => p.address === signer.address)
    if (!found || found.type === SignaturePartType.Address) {
      partsEncoded.push({
        address: signer.address,
        weight: signer.weight,
        isSignature: false,
        encoded: ethers.utils.solidityPack(
          ['uint8', 'uint8', 'address'],
          [SignaturePartType.Address, signer.weight, signer.address]
        )
      })

      continue
    }

    if (!found.signature || ethers.utils.arrayify(found.signature).length === 0) {
      throw new Error(`Expected a signature for type ${found.type}`)
    }

    if (found.type === SignaturePartType.Dynamic || options?.forceDynamicEncoding) {
      const sigArray = ethers.utils.arrayify(found.signature)
      partsEncoded.push({
        address: signer.address,
        weight: signer.weight,
        isSignature: true,
        encoded: ethers.utils.solidityPack(
          ['uint8', 'uint8', 'address', 'uint16', 'bytes'],
          [SignaturePartType.Dynamic, signer.weight, signer.address, sigArray.length, found.signature]
        )
      })

      continue
    }

    if (found.type === SignaturePartType.Signature) {
      partsEncoded.push({
        address: signer.address,
        weight: signer.weight,
        isSignature: true,
        encoded: ethers.utils.solidityPack(
          ['uint8', 'uint8', 'bytes'],
          [SignaturePartType.Signature, signer.weight, found.signature]
        )
      })

      continue
    }

    throw new Error(`Unsupported signature type ${found.type}`)
  }

  const leafs: {
    included: boolean,
    value: string
  }[] = []

  let signature = "0x"

  // Pass everything into leaves
  // if an entry doesn't have a signature but doesn't have a pair
  // it's better to include it as an address node directly
  for (let i = 0; i < partsEncoded.length; i++) {
    const i2 = i % 2 == 0 ? i + 1 : i - 1
    if (i2 >= partsEncoded.length || partsEncoded[i].isSignature || partsEncoded[i2].isSignature) {
      leafs.push({
        included: true,
        value: joinAddrAndWeight(partsEncoded[i].address, partsEncoded[i].weight)
      })

      signature = ethers.utils.solidityPack(['bytes', 'bytes'], [signature, partsEncoded[i].encoded])

    } else {
      leafs.push({
        included: false,
        value: joinAddrAndWeight(partsEncoded[i].address, partsEncoded[i].weight)
      })

      signature = ethers.utils.solidityPack(['bytes', 'uint8'], [signature, SignaturePartType.Leaf])
    }
  }

  const partsCount = config.signers.length

  let witness = '0x'

  for (let i = leafs.length; i > 1; i /= 2) {
    for (let j = 0; j < i / 2; j++) {
      const node_a = leafs[j * 2]
      const node_b = leafs[j * 2 + 1]

      if (j * 2 + 1 >= i) {
        leafs[j] = node_a
        continue
      }

      if (node_a.included != node_b.included) {
        witness = ethers.utils.solidityPack(
          ['bytes', 'bytes32'],
          [witness, node_a.included ? node_b.value : node_a.value]
        )
      }

      leafs[j] = {
        included: node_a.included || node_b.included,
        value: ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes32', 'bytes32'],
            [node_a.value, node_b.value]
          )
        )
      }
    }
  }

  switch (options?.signatureType || SignatureType.Legacy) {
    case SignatureType.Dynamic:
      signature = ethers.utils.solidityPack(['uint8', 'uint16', 'uint16', 'bytes'], [SignatureType.Dynamic, config.threshold, partsCount, signature])
      break
    case SignatureType.NoChaindDynamic:
      signature = ethers.utils.solidityPack(['uint8', 'uint16', 'uint16', 'bytes'], [SignatureType.NoChaindDynamic, config.threshold, partsCount, signature])
      break
    default:
    case SignatureType.Legacy:
      signature = ethers.utils.solidityPack(['uint16', 'uint16', 'bytes'], [config.threshold, partsCount, signature])
      break
  }

  return ethers.utils.solidityPack(['bytes', 'bytes'], [signature, witness])
}

export function encodeSignature2(
    config: WalletConfig,
    parts: SignaturePart[],
    options?: EncodingOptions
  ) {
  let signature: string = "0x"

  const leafs: {
    included: boolean,
    value: string
  }[] = []

  for (const signer of config.signers) {
    const found = parts.find((p) => p.address === signer.address)
    if (!found || found.type === SignaturePartType.Address) {
      signature = ethers.utils.solidityPack(
        ['bytes', 'uint8'],
        [signature, 3]
      )

      leafs.push({
        included: false,
        value: joinAddrAndWeight(signer.address, signer.weight),
      })

      continue
    }

    if (!found.signature || ethers.utils.arrayify(found.signature).length === 0) {
      throw new Error(`Expected a signature for type ${found.type}`)
    }

    if (found.type === SignaturePartType.Dynamic || options?.forceDynamicEncoding) {
      const sigArray = ethers.utils.arrayify(found.signature)
      signature = ethers.utils.solidityPack(
        ['bytes', 'uint8', 'uint8', 'address', 'uint16', 'bytes'],
        [signature, SignaturePartType.Dynamic, signer.weight, signer.address, sigArray.length, found.signature]
      )

      leafs.push({
        included: true,
        value: joinAddrAndWeight(signer.address, signer.weight),
      })

      continue
    }

    if (found.type === SignaturePartType.Signature) {
      signature = ethers.utils.solidityPack(
        ['bytes', 'uint8', 'uint8', 'bytes'],
        [signature, SignaturePartType.Signature, signer.weight, found.signature]
      )

      leafs.push({
        included: true,
        value: joinAddrAndWeight(signer.address, signer.weight),
      })

      continue
    }

    throw new Error(`Unsupported signature type ${found.type}`)
  }

  const partsCount = config.signers.length

  let witness = '0x'

  for (let i = leafs.length; i > 1; i /= 2) {
    for (let j = 0; j < i / 2; j++) {
      const node_a = leafs[j * 2]
      const node_b = leafs[j * 2 + 1]

      if (j * 2 + 1 >= i) {
        leafs[j] = node_a
        continue
      }

      if (node_a.included != node_b.included) {
        witness = ethers.utils.solidityPack(
          ['bytes', 'bytes32'],
          [witness, node_a.included ? node_b.value : node_a.value]
        )
      }

      leafs[j] = {
        included: node_a.included || node_b.included,
        value: ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes32', 'bytes32'],
            [node_a.value, node_b.value]
          )
        )
      }
    }
  }

  switch (options?.signatureType || SignatureType.Legacy) {
    case SignatureType.Dynamic:
      signature = ethers.utils.solidityPack(['uint8', 'uint16', 'uint16', 'bytes'], [SignatureType.Dynamic, config.threshold, partsCount, signature])
      break
    case SignatureType.NoChaindDynamic:
      signature = ethers.utils.solidityPack(['uint8', 'uint16', 'uint16', 'bytes'], [SignatureType.NoChaindDynamic, config.threshold, partsCount, signature])
      break
    default:
    case SignatureType.Legacy:
      signature = ethers.utils.solidityPack(['uint16', 'uint16', 'bytes'], [config.threshold, partsCount, signature])
      break
  }

  return ethers.utils.solidityPack(['bytes', 'bytes'], [signature, witness])
}

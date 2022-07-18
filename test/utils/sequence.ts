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
  Signature = 0,
  Address = 1,
  Dynamic = 2,
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

export type ImageHashLeaf = {
  address: string,
  weight: BigNumberish
}

export type ImageHashNode = {
  left: ImageHashNode | ImageHashLeaf,
  right: ImageHashNode | ImageHashLeaf
}

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

export function joinAddrAndWeight(address: string, weight: ethers.BigNumberish) {
  return ethers.utils.solidityPack(
    ['uint96', 'address'],
    [weight, address]
  )
}

export function imageHash(config: WalletConfig): string {
  const imageHash = config.signers.reduce((p, c) => {
    const node = joinAddrAndWeight(c.address, c.weight)
    if (p.length === 0) return node
    return ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'bytes32'],
        [p, node]
      )
    )
  }, '')

  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'uint256'],
      [imageHash.length === 0 ? ethers.constants.HashZero : imageHash, config.threshold]
    )
  )
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
  let signature: string

  switch (options?.signatureType || SignatureType.Legacy) {
    case SignatureType.Dynamic:
      signature = ethers.utils.solidityPack(['uint8', 'uint16'], [SignatureType.Dynamic, config.threshold])
      break
    case SignatureType.NoChaindDynamic:
      signature = ethers.utils.solidityPack(['uint8', 'uint16'], [SignatureType.NoChaindDynamic, config.threshold])
      break
    default:
    case SignatureType.Legacy:
      signature = ethers.utils.solidityPack(['uint16'], [config.threshold])
      break
  }

  for (const signer of config.signers) {
    const found = parts.find((p) => p.address === signer.address)
    if (!found || found.type === SignaturePartType.Address) {
      signature = ethers.utils.solidityPack(
        ['bytes', 'uint8', 'uint8', 'address'],
        [signature, SignaturePartType.Address, signer.weight, signer.address]
      )
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
      continue
    }

    if (found.type === SignaturePartType.Signature) {
      signature = ethers.utils.solidityPack(
        ['bytes', 'uint8', 'uint8', 'bytes'],
        [signature, SignaturePartType.Signature, signer.weight, found.signature]
      )
      continue
    }

    throw new Error(`Unsupported signature type ${found.type}`)
  }

  return signature
}

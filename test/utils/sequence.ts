import { BigNumberish, BytesLike, ethers, Wallet } from "ethers"
import { CHAIN_ID } from "."

export const WALLET_CODE = '0x603a600e3d39601a805130553df3363d3d373d3d3d363d30545af43d82803e903d91601857fd5bf3'

export enum SignatureType {
  Legacy = 0,
  Dynamic = 1,
  NoChaindDynamic = 2,
}

export type SignerLeaf = {
  address: string,
  weight: BigNumberish
}

export type SubdigestLeaf = {
  subDigest: string
}

export type NestedLeaf = {
  tree: ConfigTopology,
  internalThreshold: BigNumberish,
  externalWeight: BigNumberish,
}

export type ConfigLeaf = SubdigestLeaf | SignerLeaf | NestedLeaf

export type ImageHashNode = {
  left: ImageHashNode | ConfigLeaf,
  right: ImageHashNode | ConfigLeaf
}

export type ConfigTopology = ImageHashNode | ConfigLeaf

export type WalletConfig = {
  threshold: ethers.BigNumberish,
  checkpoint: ethers.BigNumberish,
  topology: ConfigTopology
}

export type SimplifiedNestedWalletConfig = {
  threshold: ethers.BigNumberish,
  weight: ethers.BigNumberish,
  signers: SimplifiedConfigMember[]
}

export type SimplifiedWalletConfig = {
  threshold: BigNumberish,
  checkpoint: BigNumberish,
  signers: SimplifiedConfigMember[]
}


export type SimplifiedConfigMember = SignerLeaf | SimplifiedNestedWalletConfig

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
  Node = 3,
  Branch = 4,
  SubDigest = 5,
  Nested = 6
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

export function isConfigLeaf(node: ConfigTopology): node is ConfigLeaf {
  return !('left' in node || 'right' in node)
}

export function isSignerLeaf(node: any): node is SignerLeaf {
  return isConfigLeaf(node) && 'weight' in node && 'address' in node
}

export function isSubdigestLeaf(node: ConfigTopology): node is SubdigestLeaf {
  return isConfigLeaf(node) && 'subDigest' in node
}

export function isNestedLeaf(node: ConfigTopology): node is NestedLeaf {
  return isConfigLeaf(node) && 'tree' in node
}

export function legacyTopology(leavesOrConfig: SimplifiedWalletConfig | ConfigTopology[]): ConfigTopology {
  if (!Array.isArray(leavesOrConfig)) {
    return legacyTopology(toTopology(leavesOrConfig))
  }

  return leavesOrConfig.reduce((acc, leaf) => {
    return {
      left: acc,
      right: leaf
    }
  })
}

export function toTopology(config: SimplifiedWalletConfig | SimplifiedNestedWalletConfig): ConfigTopology[] {
  return config.signers.map(s => {
    if (isSignerLeaf(s)) {
      return {
        address: s.address,
        weight: s.weight
      }
    }

    return {
      tree: merkleTopology(toTopology(s)),
      internalThreshold: s.threshold,
      externalWeight: s.weight
    }
  }) as ConfigTopology[]
}

export function merkleTopology(leavesOrConfig: SimplifiedWalletConfig | ConfigTopology[]): ConfigTopology {
  if (!Array.isArray(leavesOrConfig)) {
    return merkleTopology(toTopology(leavesOrConfig))
  }

  const leaves = leavesOrConfig
  for (let s = leaves.length; s > 1; s = s / 2) {
    for (let i = 0; i < s / 2; i++) {
      const j1 = i * 2
      const j2 = j1 + 1

      if (j2 >= s) {
        leaves[i] = leaves[j1]
      } else {
        leaves[i] = {
          left: leaves[j1],
          right: leaves[j2]
        }
      }
    }
  }

  return leaves[0]
}

export function optimize2SignersTopology(config: SimplifiedWalletConfig): ConfigTopology {
  if (config.signers.length > 8) {
    return merkleTopology(config)
  }

  return legacyTopology(config)
}

export function leavesOf(topology: ConfigTopology): ConfigLeaf[] {
  if (isConfigLeaf(topology)) {
    return [topology]
  }

  return [
    ...leavesOf(topology.left),
    ...leavesOf(topology.right)
  ]
}

export function subdigestLeaves(topology: ConfigTopology): string[] {
  return leavesOf(topology).filter((l) => isSubdigestLeaf(l)).map((l: SubdigestLeaf) => l.subDigest)
}

export function toSimplifiedConfig(config: WalletConfig): SimplifiedWalletConfig {
  let leaves = leavesOf(config.topology).filter((l) => isSignerLeaf(l)) as SignerLeaf[]

  return {
    threshold: config.threshold,
    checkpoint: config.checkpoint,
    signers: leaves.map(l => ({
      weight: l.weight,
      address: l.address
    }))
  }
}

export function hashNode(node: ConfigTopology): string {
  if (isSignerLeaf(node)) {
    return joinAddrAndWeight(node.address, node.weight)
  }

  if (isSubdigestLeaf(node)) {
    return ethers.utils.solidityKeccak256(
      ['string', 'bytes32'],
      ['Sequence static digest:\n', node.subDigest]
    )
  }

  if (isNestedLeaf(node)) {
    return ethers.utils.solidityKeccak256(
      ['string', 'bytes32', 'uint256', 'uint256'],
      ['Sequence nested config:\n', hashNode(node.tree), node.internalThreshold, node.externalWeight]
    )
  }

  return ethers.utils.solidityKeccak256(
    ['bytes32', 'bytes32'],
    [hashNode(node.left), hashNode(node.right)]
  )
}

export function imageHash2(threshold: ethers.BigNumberish, topology: ConfigTopology): string {
  const root = hashNode(topology)
  return ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ['bytes32', 'uint256'],
      [root, threshold]
    )
  )
}

export function printTopology(topology: ConfigTopology, threshold?: ethers.BigNumberish, inverse = false): string[] {
  if (threshold) {
    const imageHash = imageHash2(threshold, topology)

    const result: string[] = [`imageHash: ${imageHash}`]
    const signers = printTopology(topology, undefined, inverse)
    result.push(`  ├─ threshold: ${threshold}`)
    for (let i = 0; i < signers.length; i++) {
      const prefix = i === 0 ? '  └─ ' : '   '
      result.push(`${prefix}${signers[i]}`)
    }

    return result
  }

  if (isSignerLeaf(topology)) {
    return [`weight: ${topology.weight} - address: ${topology.address}`]
  }

  if (isSubdigestLeaf(topology)) {
    return [`subDigest: ${topology.subDigest}`]
  }

  if (isNestedLeaf(topology)) {
    const result: string[] = [`internalThreshold: ${topology.internalThreshold} - externalWeight: ${topology.externalWeight}`]
    const signers = printTopology(topology.tree, undefined, inverse)
    for (let i = 0; i < signers.length; i++) {
      const prefix = i === 0 ? '└─ ' : '  '
      result.push(`${prefix}${signers[i]}`)
    }

    return result
  }

  const root = hashNode(topology)
  let printLeft = printTopology(topology.left, undefined, inverse)
  let printRight = printTopology(topology.right, undefined, inverse)

  if (inverse) {
    ([printLeft, printRight] = [printRight, printLeft])
  }

  const result = [`${root}`]
  for (let i = 0; i < printLeft.length; i++) {
    const prefix = i === 0 ? '  ├─ ' : '  │'
    result.push(`${prefix}${printLeft[i]}`)
  }

  for (let i = 0; i < printRight.length; i++) {
    const prefix = i === 0 ? '  └─ ' : '   '
    result.push(`${prefix}${printRight[i]}`)
  }

  return result
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

export function encodeNonce(space: BigNumberish, nonce: BigNumberish) {
  return ethers.BigNumber.from(ethers.utils.solidityPack(['uint160', 'uint96'], [space, nonce]))
}

export function joinAddrAndWeight(address: string, weight: ethers.BigNumberish) {
  return ethers.utils.solidityPack(
    ['uint96', 'address'],
    [weight, address]
  )
}

export function imageHash(config: WalletConfig): string {
  const signersRoot = hashNode(config.topology)

  const preImageHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'uint256'],
      [signersRoot, config.threshold]
    )
  )

  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'uint256'],
      [preImageHash, config.checkpoint]
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
  disableTrim?: boolean
}

function leftSlice(topology: ConfigTopology): ConfigTopology[] {
  // Returns left side of the tree
  let stack: ConfigTopology[] = []

  let prev = topology
  while (!isConfigLeaf(prev)) {
    stack.unshift(prev.right)
    prev = prev.left
  }

  stack.unshift(prev)

  return stack
}

type DecodedSignatureMember = {
  weight?: ethers.BigNumberish,
  address?: string,
  type: SignaturePartType,
  value?: string,
  innerThreshold?: ethers.BigNumberish,
}

export class SignatureConstructor {
  private members: DecodedSignatureMember[] = []

  constructor(public disableTrim = false) {}

  tryTrim(): void {   
    if (this.disableTrim) return

    // Can only trim when we have two members
    if (this.members.length !== 2) return

    // There are 4 valid trim options:
    // 1. Trim the first addr, second is node
    // 2. Trim the first node, second is addr
    // 3. Trim the first addr, second is addr
    // 4. Trim the first node, second is node

    const first = this.members[0]
    const second = this.members[1]

    if (first.type !== SignaturePartType.Address && first.type !== SignaturePartType.Node) return
    if (second.type !== SignaturePartType.Address && second.type !== SignaturePartType.Node) return

    const firstNode = first.type === SignaturePartType.Address ? joinAddrAndWeight(first.address!, first.weight!) : first.value
    const secondNode = second.type === SignaturePartType.Address ? joinAddrAndWeight(second.address!, second.weight!) : second.value

    const nextNode = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ['bytes32', 'bytes32'],
        [firstNode, secondNode]
      )
    )

    this.members = [{
      type: SignaturePartType.Node,
      value: nextNode
    }]
  }

  appendPart(weight: ethers.BigNumberish, part: SignaturePart) {
    switch (part.type) {
      case SignaturePartType.Address:
        this.members.push({ weight, address: part.address, type: SignaturePartType.Address })
        break;

      case SignaturePartType.Signature:
        this.members.push({ weight, address: part.address, type: SignaturePartType.Signature, value: part.signature })
        break;

      case SignaturePartType.Dynamic:
        this.members.push({ weight, address: part.address, type: SignaturePartType.Dynamic, value: part.signature })
        break;

      default:
        throw new Error(`Unknown signature part type: ${part.type}`)
    }

    this.tryTrim()
  }

  appendNode(node: string) {
    this.members.push({ type: SignaturePartType.Node, value: node })
    this.tryTrim()
  }

  appendBranch(branch: string) {
    this.members.push({ type: SignaturePartType.Branch, value: branch })
  }

  appendSubdigest(subDigest: string) {
    this.members.push({ type: SignaturePartType.SubDigest, value: subDigest})
  }

  appendNested(branch: string, weight: ethers.BigNumberish, innerThreshold: ethers.BigNumberish) {
    this.members.push({ type: SignaturePartType.Nested, value: branch, innerThreshold, weight })
  }

  encode(): string {
    let result = '0x'

    for (const member of this.members) {
      switch (member.type) {
        case SignaturePartType.Address:
          result = ethers.utils.solidityPack(
            ['bytes', 'uint8', 'uint8', 'address'],
            [result, SignaturePartType.Address, member.weight, member.address]
          )
          break;

        case SignaturePartType.Signature:
          result = ethers.utils.solidityPack(
            ['bytes', 'uint8', 'uint8', 'bytes'],
            [result, SignaturePartType.Signature, member.weight, member.value]
          )
          break;

        case SignaturePartType.Dynamic:
          const signature = ethers.utils.arrayify(member.value ?? [])
          result = ethers.utils.solidityPack(
            ['bytes', 'uint8', 'uint8', 'address', 'uint24', 'bytes'],
            [result, SignaturePartType.Dynamic, member.weight, member.address, signature.length, signature]
          )
          break;

        case SignaturePartType.Node:
          result = ethers.utils.solidityPack(
            ['bytes', 'uint8', 'bytes32'],
            [result, SignaturePartType.Node, member.value]
          )
          break;

        case SignaturePartType.Branch:
          const branch = ethers.utils.arrayify(member.value ?? [])
          result = ethers.utils.solidityPack(
            ['bytes', 'uint8', 'uint24', 'bytes'],
            [result, SignaturePartType.Branch, branch.length, branch]
          )
          break

        case SignaturePartType.SubDigest:
          result = ethers.utils.solidityPack(
            ['bytes', 'uint8', 'bytes32'],
            [result, SignaturePartType.SubDigest, member.value]
          )
          break

        case SignaturePartType.Nested:
          const nestedBranch = ethers.utils.arrayify(member.value ?? [])
          result = ethers.utils.solidityPack(
            ['bytes', 'uint8', 'uint8', 'uint16', 'uint24', 'bytes'],
            [result, SignaturePartType.Nested, member.weight, member.innerThreshold, nestedBranch.length, nestedBranch]
          )
          break

        default:
          throw new Error(`Unknown signature part type: ${member.type}`)
      }
    }

    return result
  }
}

export function encodeSigners(
  topology: ConfigTopology,
  parts: SignaturePart[] | Map<string, SignaturePart>,
  subDigests: string[],
  options?: EncodingOptions
): { encoded: string, weight: ethers.BigNumber } {
  // Map part to signers
  if (Array.isArray(parts)) {
    const partOfSigner = new Map<string, SignaturePart>()
    for (const part of parts) {
      partOfSigner.set(part.address, part)
    }
    return encodeSigners(topology, partOfSigner, subDigests, options)
  }

  const slice = leftSlice(topology)
  let weight = ethers.constants.Zero

  const constructor = new SignatureConstructor(options?.disableTrim)
  for (const node of slice) {
    if (!isConfigLeaf(node)) {
      // If the node opens up to another branch
      // we recurse the encoding, and if the result has any weight
      // we have to embed the whole branch, otherwise we just add the node
      const nested = encodeSigners(node, parts, subDigests, options)
      if (nested.weight.isZero() && !options?.disableTrim) {
        constructor.appendNode(hashNode(node))
      } else {
        constructor.appendBranch(nested.encoded)
        weight = weight.add(nested.weight)
      }
    } else {
      if (isSignerLeaf(node)) {
        // If the node is a signer leaf, we can just add the member
        const part = parts.get(node.address) ?? { type: SignaturePartType.Address, address: node.address }
        if (part.type !== SignaturePartType.Address) {
          weight = weight.add(node.weight)
        }
  
        constructor.appendPart(node.weight, part)
      } else if (isNestedLeaf(node)) {
        // If the node opens up to another branch
        // we recurse the encoding, and if the result has any weight
        // we have to embed the whole branch, otherwise we just add the node
        const nested = encodeSigners(node.tree, parts, subDigests, options)
        if (nested.weight.isZero() && !options?.disableTrim) {
          constructor.appendNode(hashNode(node))
        } else {
          // Nested configs only have weight if the inner threshold is met
          // and the weight is always the external weight
          if (nested.weight.gte(node.internalThreshold)) {
            weight = weight.add(node.externalWeight)
          }

          constructor.appendNested(nested.encoded, node.externalWeight, node.internalThreshold)
        }
      } else {
        // If the node is a subdigest add the node (unless it's an static subdigest signature)
        if (subDigests.includes(node.subDigest)) {
          weight = weight.add(ethers.BigNumber.from(2).pow(256).sub(1))
          constructor.appendSubdigest(node.subDigest)
        } else {
          constructor.appendNode(hashNode(node))
        }
      }
    }
  }

  return {
    encoded: constructor.encode(),
    weight
  }
}

export function encodeSignature(
  config: WalletConfig,
  parts: SignaturePart[] | Map<string, SignaturePart>,
  subDigests: string[],
  options?: EncodingOptions
) {
  const encodedSigners = encodeSigners(config.topology, parts, subDigests, options)

  switch (options?.signatureType || SignatureType.Legacy) {
    case SignatureType.Dynamic:
      return ethers.utils.solidityPack(
        ['uint8', 'uint16', 'uint32', 'bytes'],
        [SignatureType.Dynamic, config.threshold, config.checkpoint, encodedSigners.encoded]
      )
    case SignatureType.NoChaindDynamic:
      return ethers.utils.solidityPack(
        ['uint8', 'uint16', 'uint32', 'bytes'],
        [SignatureType.NoChaindDynamic, config.threshold, config.checkpoint, encodedSigners.encoded]
      )
    default:
    case SignatureType.Legacy:
      return ethers.utils.solidityPack(
        ['uint8', 'uint8', 'uint32', 'bytes'],
        [SignatureType.Legacy, config.threshold, config.checkpoint, encodedSigners.encoded]
      )
  }
}

import { ethers, Overrides } from "ethers"
import { shuffle } from "."
import { MainModule, MainModuleUpgradable, SequenceContext } from "./contracts"
import { addressOf, applyTxDefaults, digestOf, encodeSignature, EncodingOptions, imageHash, SignaturePartType, subDigestOf, Transaction, WalletConfig } from "./sequence"

export type StaticSigner = (ethers.Signer & { address: string })
export type AnyStaticSigner = StaticSigner | SequenceWallet

export function isAnyStaticSigner(s: any): s is AnyStaticSigner {
  return s.address !== undefined
}

export type WalletOptions = {
  context: SequenceContext
  config: WalletConfig
  address?: string
  signers: (ethers.Signer | SequenceWallet)[]
  encodingOptions?: EncodingOptions
  chainId?: ethers.BigNumberish
}

export type BasicWalletOptions = {
  address?: string,
  threshold?: number,
  signing: number | number[],
  iddle: number | number[],
  encodingOptions?: EncodingOptions
}

export type DetailedWalletOptions = {
  address?: string,
  threshold: ethers.BigNumberish,
  signers: (string | AnyStaticSigner | Weighted<string> | Weighted<AnyStaticSigner>)[],
  encodingOptions?: EncodingOptions
}

export type Weighted<T> = { weight: number, value: T }

export function isWeighted<T>(w: any): w is Weighted<T> {
  return w.weight !== undefined && w.value !== undefined
}

export function weightedVal<T>(w: Weighted<T> | T): T {
  return isWeighted(w) ? w.value : w
}

export function isSequenceSigner(signer: ethers.Signer | SequenceWallet): signer is SequenceWallet {
  return (signer as any).isSequence
}

export class SequenceWallet {
  public isSequence = true
  _isSigner: boolean = true

  constructor(public options: WalletOptions) {}

  static basicWallet(context: SequenceContext, opts?: Partial<BasicWalletOptions>): SequenceWallet {
    const options = { ...{ signing: 1, iddle: 0 }, ...opts }

    const signersWeight = Array.isArray(options.signing) ? options.signing : new Array(options.signing).fill(0).map(() => 1)
    const iddleWeight = Array.isArray(options.iddle) ? options.iddle : new Array(options.iddle).fill(0).map(() => 1)

    const signers = signersWeight.map((s) => isAnyStaticSigner(s) ? s : ethers.Wallet.createRandom())
    const iddle = iddleWeight.map(() => ethers.Wallet.createRandom())

    return new SequenceWallet({
      address: options.address,
      context,
      encodingOptions: options.encodingOptions,
      config: {
        threshold: options.threshold ? options.threshold : signers.length,
        signers: shuffle(
          signers.map((s, i) => ({
            address: s.address,
            weight: signersWeight[i]
          })).concat(
            iddle.map((s, i) => ({
              address: s.address,
              weight: iddleWeight[i]
            })
          ))
        )
      },
      signers: signers
    })
  }

  static detailedWallet(context: SequenceContext, opts: DetailedWalletOptions): SequenceWallet {
    return new SequenceWallet({
      context,
      encodingOptions: opts.encodingOptions,
      address: opts.address,
      config: {
        threshold: opts.threshold,
        signers: opts.signers.map((s) => ({
          weight: isWeighted(s) ? s.weight : 1,
          address: (() => { const v = weightedVal(s); return isAnyStaticSigner(v) ? v.address : v })()
        }))
      },
      signers: opts.signers.map((s) => weightedVal(s)).filter((s) => isAnyStaticSigner(s)) as StaticSigner[]
    })
  }

  useConfig(of: SequenceWallet | WalletConfig) {
    const config = (of as any).address !== undefined ? (of as any).config : of
    return new SequenceWallet({ ...this.options, config })
  }

  useSigners(signers: (ethers.Signer | SequenceWallet)[] | ethers.Signer | SequenceWallet) {
    return new SequenceWallet({ ...this.options, signers: Array.isArray(signers) ? signers : [signers] })
  }
  
  useEncodingOptions(encodingOptions?: EncodingOptions) {
    return new SequenceWallet({ ...this.options, encodingOptions })
  }

  useChainId(chainId?: ethers.BigNumberish) {
    return new SequenceWallet({ ...this.options, chainId })
  }

  get config() {
    return this.options.config
  }

  get signers() {
    return this.options.signers
  }

  get address() {
    if (this.options.address) return this.options.address
    return addressOf(this.options.context.factory.address, this.options.context.mainModule.address, this.imageHash)
  }

  getAddress() {
    return this.address  
  }

  get imageHash() {
    return imageHash(this.config)
  }

  get mainModule() {
    return MainModule.attach(this.address)
  }

  get mainModuleUpgradable() {
    return MainModuleUpgradable.attach(this.address)
  }

  async deploy() {
    return this.options.context.factory.deploy(this.options.context.mainModule.address, this.imageHash)
  }

  async getNonce(space: ethers.BigNumberish = 0) {
    return this.mainModule.readNonce(space)
  }

  async updateImageHash(input: ethers.BytesLike | WalletConfig) {
    if (!ethers.utils.isBytesLike(input)) return this.updateImageHash(imageHash(input))

    return this.sendTransactions([{
      target: this.address,
      data: this.options.context.mainModule.interface.encodeFunctionData(
        'updateImageHash', [input]
      )
    }])
  }

  async signMessage(message: ethers.BytesLike): Promise<string> {
    return this.signDigest(ethers.utils.keccak256(ethers.utils.arrayify(message)))
  }

  async signDigest(digest: ethers.BytesLike): Promise<string> {
    const subDigest = ethers.utils.arrayify(subDigestOf(this.address, digest, this.options.chainId))
    return this.signSubDigest(subDigest)
  }

  async signSubDigest(subDigest: ethers.BytesLike): Promise<string> {
    const sigParts = await Promise.all(this.signers.map(async (s) => {
      if (isSequenceSigner(s)) {
        return {
          address: s.address,
          signature: await s.signDigest(subDigest).then((s) => s + '03'),
          type: SignaturePartType.Dynamic
        }
      }

      return {
        address: await s.getAddress(),
        signature: await s.signMessage(subDigest).then((s) => s + '02'),
        type: SignaturePartType.Signature
      }
    }))

    return encodeSignature(this.config, sigParts, this.options.encodingOptions)
  }

  async signTransactions(ptxs: Partial<Transaction>[], nonce?: ethers.BigNumberish): Promise<string> {
    if (nonce === undefined) return this.signTransactions(ptxs, await this.getNonce())

    const txs = applyTxDefaults(ptxs)
    const digest = digestOf(txs, nonce)

    return this.signDigest(digest)
  }

  async relayTransactions(
    ptxs: Partial<Transaction>[],
    signature: string,
    nonce?: ethers.BigNumberish,
    overrides: Overrides & { from?: string | Promise<string> } = {}
  ): Promise<ethers.ContractTransaction> {
    if (nonce === undefined) return this.relayTransactions(ptxs, signature, await this.getNonce(), overrides)

    const txs = applyTxDefaults(ptxs)

    return this.mainModule.execute(txs, nonce, signature, overrides)
  }

  async sendTransactions(
    ptxs: Partial<Transaction>[],
    nonce?: ethers.BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ethers.ContractTransaction> {
    if (nonce === undefined) return this.sendTransactions(ptxs, await this.getNonce(), overrides)

    const txs = applyTxDefaults(ptxs)
    const signature = await this.signTransactions(txs, nonce)

    return this.relayTransactions(txs, signature, nonce, overrides)
  }
}

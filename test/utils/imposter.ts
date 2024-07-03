import { ethers } from 'ethers'
import { AnyStaticSigner, StaticSigner } from './wallet'

export class Imposter extends ethers.AbstractSigner implements StaticSigner {
  static random(identity: string | AnyStaticSigner) {
    return new Imposter(identity, ethers.Wallet.createRandom())
  }

  constructor(
    public identity: string | AnyStaticSigner,
    public signer: ethers.Signer
  ) {
    super()
  }

  get address() {
    return typeof this.identity === 'string' ? this.identity : this.identity.address
  }

  async getAddress(): Promise<string> {
    return this.address
  }

  signMessage(message: string | Uint8Array): Promise<string> {
    return this.signer.signMessage(message)
  }

  signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>
  ): Promise<string> {
    return this.signer.signTypedData(domain, types, value)
  }

  signTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    return this.signer.signTransaction(transaction)
  }

  connect(provider: ethers.Provider): ethers.Signer {
    return this.signer.connect(provider)
  }
}

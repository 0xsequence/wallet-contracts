import { ethers } from 'ethers'
import { AnyStaticSigner, StaticSigner } from './wallet'

export class Imposter extends ethers.Signer implements StaticSigner {
  static random(identity: string | AnyStaticSigner) {
    return new Imposter(identity, ethers.Wallet.createRandom())
  }

  constructor (public identity: string | AnyStaticSigner, public signer: ethers.Signer) { super() }

  get address() {
    return typeof this.identity === 'string' ? this.identity : this.identity.address
  }

  async getAddress(): Promise<string> {
    return this.address
  }

  signMessage(message: string | ethers.utils.Bytes): Promise<string> {
    return this.signer.signMessage(message)
  }

  signTransaction(transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>): Promise<string> {
    return this.signer.signTransaction(transaction)
  }

  connect(provider: ethers.providers.Provider): ethers.Signer {
    return this.signer.connect(provider)
  }
}

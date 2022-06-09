import * as ethers from 'ethers'
import { BytesLike, BigNumberish } from 'ethers'
import { MainModule, MainModuleUpgradable } from 'src/gen/typechain'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// createTestWallet creates a new wallet
export const createTestWallet = (web3: any, addressIndex: number = 0) => {
  const provider = new Web3DebugProvider(web3.currentProvider)

  const wallet = ethers.Wallet
    .fromMnemonic(process.env.npm_package_config_mnemonic!, `m/44'/60'/0'/0/${addressIndex}`)
    .connect(provider)

  const signer = provider.getSigner(addressIndex)

  return { wallet, provider, signer }
}

// Check if tx was Reverted with specified message
export function RevertError(errorMessage?: string) {
  let prefix = 'VM Exception while processing transaction: revert'
  return errorMessage ? `${prefix + ' ' + errorMessage}` : prefix
}

export interface JSONRPCRequest {
  jsonrpc: string
  id: number
  method: any
  params: any
}

export class Web3DebugProvider extends ethers.providers.JsonRpcProvider {

  public reqCounter = 0
  public reqLog: JSONRPCRequest[] = []

  readonly _web3Provider: ethers.providers.ExternalProvider
  private _sendAsync: (request: any, callback: (error: any, response: any) => void) => void

  constructor(web3Provider: ethers.providers.ExternalProvider, network?: ethers.providers.Networkish) {
      // HTTP has a host; IPC has a path.
      super(web3Provider.host || web3Provider.path || '', network)

      if (web3Provider) {
        if (web3Provider.sendAsync) {
          this._sendAsync = web3Provider.sendAsync.bind(web3Provider)
        } else if (web3Provider.send) {
          this._sendAsync = web3Provider.send.bind(web3Provider)
        }
      }

      if (!web3Provider || !this._sendAsync) {
        ethers.logger.throwError(
          'invalid web3Provider',
          ethers.errors.INVALID_ARGUMENT,
          { arg: 'web3Provider', value: web3Provider }
        )
      }

      ethers.utils.defineReadOnly(this, '_web3Provider', web3Provider)
  }

  send(method: string, params: any): Promise<any> {

    this.reqCounter++

    return new Promise((resolve, reject) => {
      let request = {
        method: method,
        params: params,
        id: this.reqCounter,
        jsonrpc: '2.0'
      } as JSONRPCRequest
      this.reqLog.push(request)

      this._sendAsync(request, function(error, result) {
        if (error) {
          reject(error)
          return
        }

        if (result.error) {
          // @TODO: not any
          let error: any = new Error(result.error.message)
          error.code = result.error.code
          error.data = result.error.data
          reject(error)
          return
        }

        resolve(result.result)
      })
    })
  }

  getPastRequest(reverseIndex: number = 0): JSONRPCRequest {
    if (this.reqLog.length === 0) {
      return { jsonrpc: '2.0', id: 0, method: null, params: null }
    }
    return this.reqLog[this.reqLog.length-reverseIndex-1]
  }

}

// Take a message, hash it and sign it with ETH_SIGN SignatureType
export async function ethSign(wallet: ethers.Wallet, message: string | Uint8Array, hashed = false) {
  let hash = hashed ? message : ethers.utils.keccak256(message)
  let hashArray = ethers.utils.arrayify(hash)
  let ethsigNoType = await wallet.signMessage(hashArray)
  return ethsigNoType.endsWith('03') || ethsigNoType.endsWith('02') ? ethsigNoType : ethsigNoType + '02'
}

export const MetaTransactionsType = `tuple(
  bool delegateCall,
  bool revertOnError,
  uint256 gasLimit,
  address target,
  uint256 value,
  bytes data
)[]`

export function encodeMessageData(
  owner: string,
  message: string,
  networkId: BigNumberish
): string {
  return encodeMessageSubDigest(owner, ethers.utils.keccak256(message), networkId)
}

export function encodeMessageSubDigest(
  owner: string,
  digest: string,
  networkId: BigNumberish
): string {
  return ethers.utils.solidityPack(
    ['string', 'uint256', 'address', 'bytes32'],
    ['\x19\x01', networkId, owner, digest]
  )
}

export function encodeMetaTransactionsData(
  owner: string,
  txs: {
    delegateCall: boolean;
    revertOnError: boolean;
    gasLimit: BigNumberish;
    target: string;
    value: BigNumberish;
    data: BytesLike;
  }[],
  networkId: BigNumberish,
  nonce: BigNumberish
): string {
  const transactions = ethers.utils.defaultAbiCoder.encode(['uint256', MetaTransactionsType], [nonce, txs])
  return encodeMessageData(owner, transactions, networkId)
}

export async function walletSign(
  owner: ethers.Wallet,
  message: string,
  forceDynamicSize: boolean = false
) {
  return walletMultiSign([{ weight: 1, owner: owner }], 1, message, forceDynamicSize)
}

export function compareAddr(a: string | ethers.Wallet, b: string | ethers.Wallet) {
  const addrA = typeof a === 'string' ? a : a.address
  const addrB = typeof b === 'string' ? b : b.address

  const bigA = ethers.BigNumber.from(addrA)
  const bigB = ethers.BigNumber.from(addrB)

  if (bigA.lt(bigB)) {
    return -1
  } else if (bigA.eq(bigB)) {
    return 0
  } else {
    return 1
  }
}

export enum SignatureType {
  Legacy = 0,
  DynamicLegacy = 1,
  NoChaindDynamic = 2,
}

export async function walletMultiSign(
  accounts: {
    weight: BigNumberish,
    owner: string | ethers.Wallet,
    signature?: string
  }[],
  threshold: BigNumberish,
  message: string,
  forceDynamicSize: boolean = false,
  hashed = false,
  signatureType: SignatureType = SignatureType.Legacy
) {
  const sorted = accounts.sort((a, b) => compareAddr(a.owner, b.owner))
  const accountBytes = await Promise.all(
    sorted.map(async (a) => {
      if (typeof a.owner === 'string' && !a.signature) {
        return ethers.utils.solidityPack(
          ['uint8', 'uint8', 'address'],
          [1, a.weight, a.owner]
        )
      } else {
        const signature = ethers.utils.arrayify(a.signature ? a.signature as string : await ethSign(a.owner as ethers.Wallet, message, hashed))
        if (forceDynamicSize || signature.length !== 66) {
          const address = typeof a.owner === 'string' ? a.owner : a.owner.address
          return ethers.utils.solidityPack(
            ['uint8', 'uint8', 'address', 'uint16', 'bytes'],
            [2, a.weight, address, signature.length, signature]
          )
        } else {
          return ethers.utils.solidityPack(
            ['uint8', 'uint8', 'bytes'],
            [0, a.weight, signature]
          )
        }
      }
    })
  )

  if (signatureType === SignatureType.Legacy) {
    return ethers.utils.solidityPack(
      ['uint16', ...Array(accounts.length).fill('bytes')],
      [threshold, ...accountBytes]
    )
  }

  if (signatureType === SignatureType.DynamicLegacy) {
    return ethers.utils.solidityPack(
      ['uint8', 'uint16', ...Array(accounts.length).fill('bytes')],
      [signatureType, threshold, ...accountBytes]
    )
  }

  if (signatureType === SignatureType.NoChaindDynamic) {
    return ethers.utils.solidityPack(
      ['uint8', 'uint16', ...Array(accounts.length).fill('bytes')],
      [signatureType, threshold, ...accountBytes]
    )
  }

  throw new Error('Unknown signature type ' + signatureType)
}

export async function signAndEncodeMetaTxn(
  wallet: MainModule,
  owner: ethers.Wallet,
  txs: {
    delegateCall: boolean;
    revertOnError: boolean;
    gasLimit: BigNumberish;
    target: string;
    value: BigNumberish;
    data: BytesLike;
  }[],
  networkId: BigNumberish,
  nonce: BigNumberish | undefined = undefined,
  forceDynamicSize: boolean = false
) {
  return multiSignAndEncodeMetaTxn(
    wallet,
    [{weight: 1, owner }],
    1,
    txs,
    networkId,
    nonce,
    forceDynamicSize
  )
}

export async function multiSignAndEncodeMetaTxn(
  wallet: MainModule,
  accounts: {
    weight: BigNumberish,
    owner: string | ethers.Wallet
  }[],
  threshold: BigNumberish,
  txs: {
    delegateCall: boolean;
    revertOnError: boolean;
    gasLimit: BigNumberish;
    target: string;
    value: BigNumberish;
    data: BytesLike;
  }[],
  networkId: BigNumberish,
  nonce: BigNumberish | undefined = undefined,
  forceDynamicSize: boolean = false
): Promise<string> {
  if (!nonce) nonce = await nextNonce(wallet)
  const signature = await multiSignMetaTransactions(wallet, accounts, threshold, txs, networkId, nonce, forceDynamicSize)
  return (await wallet.execute(txs, nonce, signature)).data
  // return wallet.contract.methods.execute(txs, nonce, signature).encodeABI()
}

export async function multiSignMetaTransactions(
  wallet: MainModule | MainModuleUpgradable,
  accounts: {
    weight: BigNumberish,
    owner: string | ethers.Wallet
  }[],
  threshold: BigNumberish,
  txs: {
    delegateCall: boolean;
    revertOnError: boolean;
    gasLimit: BigNumberish;
    target: string;
    value: BigNumberish;
    data: BytesLike;
  }[],
  networkId: BigNumberish,
  nonce: BigNumberish,
  forceDynamicSize: boolean = false,
  signatureType: SignatureType = SignatureType.Legacy
) {
  const data = encodeMetaTransactionsData(wallet.address, txs, networkId, nonce)
  return walletMultiSign(accounts, threshold, data, forceDynamicSize, undefined, signatureType)
}

export async function nextNonce(wallet: MainModule | MainModuleUpgradable) {
  return (await wallet.nonce()).toNumber()
}

export async function signAndExecuteMetaTx(
  wallet: MainModule | MainModuleUpgradable,
  owner: ethers.Wallet,
  txs: {
    delegateCall: boolean;
    revertOnError: boolean;
    gasLimit: BigNumberish;
    target: string;
    value: BigNumberish;
    data: BytesLike;
  }[],
  networkId: BigNumberish,
  nonce: BigNumberish | undefined = undefined,
  forceDynamicSize: boolean = false,
  gasLimit?: BigNumberish,
  signatureType: SignatureType = SignatureType.Legacy
) {
  return multiSignAndExecuteMetaTx(
    wallet,
    [{ weight: 1, owner: owner }],
    1,
    txs,
    networkId,
    nonce,
    forceDynamicSize,
    gasLimit,
    signatureType
  )
}

export async function multiSignAndExecuteMetaTx(
  wallet: MainModule | MainModuleUpgradable,
  accounts: {
    weight: BigNumberish,
    owner: string | ethers.Wallet
  }[],
  threshold: BigNumberish,
  txs: {
    delegateCall: boolean;
    revertOnError: boolean;
    gasLimit: BigNumberish;
    target: string;
    value: BigNumberish;
    data: BytesLike;
  }[],
  networkId: BigNumberish,
  nonce: BigNumberish | undefined = undefined,
  forceDynamicSize: boolean = false,
  gasLimit?: BigNumberish,
  signatureType: SignatureType = SignatureType.Legacy
) {
  if (!nonce) nonce = await nextNonce(wallet)
  const signature = await multiSignMetaTransactions(wallet, accounts, threshold, txs, networkId, nonce, forceDynamicSize, signatureType)
  return wallet.execute(txs, nonce, signature, { gasLimit })
}

export function encodeImageHash(
  threshold: BigNumberish,
  accounts: {
    weight: BigNumberish
    address: string
  }[]
) {
  const sorted = accounts.sort((a, b) => compareAddr(a.address, b.address))
  let imageHash = ethers.utils.solidityPack(['uint256'], [threshold])

  sorted.forEach((a) => 
    imageHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'uint8', 'address'],
        [imageHash, a.weight, a.address]
      )
    )
  )

  return imageHash
}

export function encodeNonce(space: BigNumberish, nonce: BigNumberish) {
  const shiftedSpace = ethers.BigNumber.from(space).mul(ethers.constants.Two.pow(96))
  return ethers.BigNumber.from(nonce).add(shiftedSpace)
}

export function moduleStorageKey(key: string, subkey?: string): string {
  if (!subkey) {
    return ethers.utils.id(key)
  }

  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes32'],
      [moduleStorageKey(key), subkey]
    )
  )
}

function xor(a, b) {
  if (!Buffer.isBuffer(a)) a = Buffer.from(ethers.utils.arrayify(a))
  if (!Buffer.isBuffer(b)) b = Buffer.from(ethers.utils.arrayify(b))
  return ethers.utils.hexlify(a.map((v: number, i: number) => v ^ b[i]))
}

export function interfaceIdOf(int: ethers.utils.Interface): string {
  const signatures = Object.keys(int.functions)
    .filter((k) => k.indexOf('(') !== -1)
    .map((k) => int.getSighash(int.functions[k]))

  return signatures.reduce((p, c) => xor(p, c))
}

export const WALLET_CODE = '0x603a600e3d39601a805130553df3363d3d373d3d3d363d30545af43d82803e903d91601857fd5bf3'

export function addressOf(
  factory: string,
  mainModule: string,
  imageHash: string
): string {
  const codeHash = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ['bytes', 'bytes32'],
      [WALLET_CODE, ethers.utils.hexZeroPad(mainModule, 32)]
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

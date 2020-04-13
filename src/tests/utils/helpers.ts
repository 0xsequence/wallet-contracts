import * as ethers from 'ethers'
import { Arrayish, BigNumberish } from 'ethers/utils'
import { MainModule } from 'typings/contracts/MainModule'
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

  readonly _web3Provider: ethers.providers.AsyncSendable
  private _sendAsync: (request: any, callback: (error: any, response: any) => void) => void

  constructor(web3Provider: ethers.providers.AsyncSendable, network?: ethers.utils.Networkish) {
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
        ethers.errors.throwError(
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
export async function ethSign(wallet: ethers.Wallet, message: string | Uint8Array) {
  let hash = ethers.utils.keccak256(message)
  let hashArray = ethers.utils.arrayify(hash)
  let ethsigNoType = await wallet.signMessage(hashArray)
  return ethsigNoType + '02'
}

export const MetaTransactionsType = `tuple(
  bool delegateCall,
  bool skipOnError,
  address target,
  uint256 value,
  bytes data
)[]`

export function encodeMetaTransactionsData(
  owner: string,
  txs: {
    delegateCall: boolean;
    skipOnError: boolean;
    target: string;
    value: BigNumberish;
    data: Arrayish;
  }[],
  nonce: BigNumberish
): string {
  const transactions = ethers.utils.defaultAbiCoder.encode(['uint256', MetaTransactionsType], [nonce, txs])

  return ethers.utils.solidityPack(
    ['string', 'address', 'bytes'],
    ['\x19\x01', owner, ethers.utils.keccak256(transactions)]
  )
}

export async function walletSign(
  owner: ethers.Wallet,
  message: string
) {
  return walletMultiSign([{ weight: 1, owner: owner }], 1, message)
}

export function compareAddr(a: string | ethers.Wallet, b: string | ethers.Wallet) {
  const addrA = a instanceof ethers.Wallet ? a.address : a
  const addrB = b instanceof ethers.Wallet ? b.address : b

  const bigA = ethers.utils.bigNumberify(addrA)
  const bigB = ethers.utils.bigNumberify(addrB)

  if (bigA.lt(bigB)) {
    return -1
  } else if (bigA.eq(bigB)) {
    return 0
  } else {
    return 1
  }
}

export async function walletMultiSign(
  accounts: {
    weight: BigNumberish,
    owner: string | ethers.Wallet
  }[],
  threshold: BigNumberish,
  message: string
) {
  const sorted = accounts.sort((a, b) => compareAddr(a.owner, b.owner))
  const accountBytes = await Promise.all(
    sorted.map(async (a) => 
      a.owner instanceof ethers.Wallet ?
        ethers.utils.solidityPack(
          ['uint8', 'uint8', 'bytes'],
          [1, a.weight, await ethSign(a.owner, message)]
        ) : 
        ethers.utils.solidityPack(
          ['uint8', 'uint8', 'address'],
          [0, a.weight, a.owner]
        )
    )
  )

  return ethers.utils.solidityPack(
    ['uint8', 'uint16', ...Array(accounts.length).fill('bytes')],
    [accounts.length, threshold, ...accountBytes]
  )
}

export async function multiSignMetaTransactions(
  wallet: MainModule,
  accounts: {
    weight: BigNumberish,
    owner: string | ethers.Wallet
  }[],
  threshold: BigNumberish,
  txs: {
    delegateCall: boolean;
    skipOnError: boolean;
    target: string;
    value: BigNumberish;
    data: Arrayish;
  }[],
  nonce: BigNumberish
) {
  const data = encodeMetaTransactionsData(wallet.address, txs, nonce)
  return walletMultiSign(accounts, threshold, data)
}

export async function nextNonce(wallet: MainModule) {
  return (await wallet.nonce()).toNumber()
}

export async function signAndExecuteMetaTx(
  wallet: MainModule,
  owner: ethers.Wallet,
  txs: {
    delegateCall: boolean;
    skipOnError: boolean;
    target: string;
    value: BigNumberish;
    data: Arrayish;
  }[],
  nonce: BigNumberish | undefined = undefined
) {
  return multiSignAndExecuteMetaTx(
    wallet,
    [{ weight: 1, owner: owner }],
    1,
    txs,
    nonce
  )
}

export async function multiSignAndExecuteMetaTx(
  wallet: MainModule,
  accounts: {
    weight: BigNumberish,
    owner: string | ethers.Wallet
  }[],
  threshold: BigNumberish,
  txs: {
    delegateCall: boolean;
    skipOnError: boolean;
    target: string;
    value: BigNumberish;
    data: Arrayish;
  }[],
  nonce: BigNumberish | undefined = undefined
) {
  if (!nonce) nonce = await nextNonce(wallet)
  const signature = await multiSignMetaTransactions(wallet, accounts, threshold, txs, nonce)
  return wallet.execute(txs, nonce, signature)
}

export function encodeImageHash(
  threshold: BigNumberish,
  accounts: {
    weight: BigNumberish
    address: string
  }[]
) {
  const sorted = accounts.sort((a, b) => compareAddr(a.address, b.address))

  const weightedAddresses = sorted.map((a) => ethers.utils.solidityPack(
    ['uint8', 'address'], [a.weight, a.address]
  ))

  const image = ethers.utils.solidityPack(
    ['uint16', ...Array(sorted.length).fill('bytes21')],
    [threshold, ...weightedAddresses]
  )

  return ethers.utils.keccak256(image)
}

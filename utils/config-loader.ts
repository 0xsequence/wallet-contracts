import * as dotenv from 'dotenv'
import * as path from 'path'
import { HttpNetworkConfig } from 'hardhat/types'
import { ethers } from 'ethers'

type EthereumNetworksTypes =
  | 'rinkeby'
  | 'ropsten'
  | 'kovan'
  | 'goerli'
  | 'mainnet'
  | 'mumbai'
  | 'polygon'
  | 'polygon-zkevm'
  | 'arbitrum'
  | 'arbitrum-testnet'
  | 'arbitrum-nova'
  | 'optimism'
  | 'bnb'
  | 'bnb-testnet'
  | 'gnosis'
  | 'avalanche'
  | 'avalanche-fuji'
  | 'oasys-homeverse'
  | 'oasys-homeverse-testnet'

export const getEnvConfig = (env: string) => {
  const envFile = path.resolve(__dirname, `../config/${env}.env`)
  const envLoad = dotenv.config({ path: envFile })

  if (envLoad.error) {
    console.warn('No config found, using default')
    return { ETH_MNEMONIC: ethers.Wallet.createRandom().mnemonic.phrase }
  }

  return envLoad.parsed || {}
}

export const networkGasMultiplier = (network: EthereumNetworksTypes): number => {
  switch (network) {
    default:
      return 1
  }
}

export const networkRpcUrl = (network: EthereumNetworksTypes): string => {
  const config = getEnvConfig('PROD')

  switch (network) {
    case 'mumbai':
      return 'https://endpoints.omniatech.io/v1/matic/mumbai/public'

    case 'polygon':
      return 'https://nodes.sequence.app/polygon'

    case 'arbitrum-testnet':
      return 'https://rinkeby.arbitrum.io/rpc'

    case 'arbitrum':
      return 'https://endpoints.omniatech.io/v1/arbitrum/one/public'
    
    case 'arbitrum-nova':
      return 'https://nova.arbitrum.io/rpc'

    case 'optimism':
      return 'https://endpoints.omniatech.io/v1/op/mainnet/public'

    case 'bnb':
      return 'https://bsc-dataseed3.binance.org'

    case 'gnosis':
      return 'https://gnosis-mainnet.public.blastapi.io'

    case 'polygon-zkevm':
      return 'https://zkevm-rpc.com'

    case 'avalanche':
      return 'https://endpoints.omniatech.io/v1/avax/mainnet/public'

    case 'bnb-testnet':
      return 'https://endpoints.omniatech.io/v1/bsc/testnet/public'

    case 'avalanche-fuji':
      return 'https://endpoints.omniatech.io/v1/avax/fuji/public'

    case 'oasys-homeverse':
      return 'https://rpc.mainnet.oasys.homeverse.games'

    case 'oasys-homeverse-testnet':
      return 'https://rpc.testnet.oasys.homeverse.games'

    default:
      return `https://${network}.infura.io/v3/${config['INFURA_API_KEY']}`
  }
}

export const networkChainId = (network: EthereumNetworksTypes): number => {
  const config = getEnvConfig('PROD')

  switch (network) {
    case 'mumbai':
      return 80001

    case 'ropsten':
      return 3

    case 'polygon':
      return 137

    case 'arbitrum-testnet':
      return 421611

    case 'arbitrum':
      return 42161

    case 'rinkeby':
      return 4

    case 'goerli':
      return 5

    case 'mainnet':
      return 1

    case 'kovan':
      return 42

    case 'arbitrum-nova':
      return 42170

    case 'optimism':
      return 10

    case 'bnb':
      return 56

    case 'gnosis':
      return 100

    case 'polygon-zkevm':
      return 1101

    case 'avalanche':
      return 43114

    case 'bnb-testnet':
      return 97

    case 'avalanche-fuji':
      return 43113

    case 'oasys-homeverse':
      return 19011

    case 'oasys-homeverse-testnet':
      return 40875
  }
}

export const networkConfig = (network: EthereumNetworksTypes): HttpNetworkConfig & { etherscan?: string } => {
  const config = getEnvConfig('PROD')
  return {
    url: networkRpcUrl(network),
    chainId: networkChainId(network),
    accounts: {
      mnemonic: config['ETH_MNEMONIC'],
      initialIndex: 0,
      count: 10,
      path: `m/44'/60'/0'/0`,
      passphrase: ''
    },
    gas: 'auto',
    gasPrice: 'auto',
    gasMultiplier: networkGasMultiplier(network),
    timeout: 20000,
    httpHeaders: {},
    etherscan: config['ETHERSCAN']
  }
}

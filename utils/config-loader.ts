import * as dotenv from 'dotenv'
import * as path from 'path'
import { HttpNetworkConfig } from 'hardhat/types'
import { ethers } from 'ethers'

type EthereumNetworksTypes =
  | 'mainnet'
  | 'ropsten'
  | 'kovan'
  | 'goerli'
  | 'polygon'
  | 'polygon-zkevm'
  | 'mumbai'
  | 'arbitrum'
  | 'arbitrum-goerli'
  | 'arbitrum-nova'
  | 'optimism'
  | 'bnb'
  | 'bnb-testnet'
  | 'gnosis'
  | 'avalanche'
  | 'avalanche-fuji'

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

    case 'polygon-zkevm':
      return 'https://zkevm-rpc.com'

    case 'arbitrum':
      return 'https://endpoints.omniatech.io/v1/arbitrum/one/public'

    case 'arbitrum-goerli':
      return 'https://goerli-rollup.arbitrum.io/rpc'

    case 'arbitrum-nova':
      return 'https://nova.arbitrum.io/rpc'

    case 'optimism':
      return 'https://endpoints.omniatech.io/v1/op/mainnet/public'

    case 'bnb':
      return 'https://bsc-dataseed3.binance.org'

    case 'bnb-testnet':
      return 'https://endpoints.omniatech.io/v1/bsc/testnet/public'

    case 'gnosis':
      return 'https://gnosis-mainnet.public.blastapi.io'

    case 'avalanche':
      return 'https://endpoints.omniatech.io/v1/avax/mainnet/public'

    case 'avalanche-fuji':
      return 'https://endpoints.omniatech.io/v1/avax/fuji/public'

    default:
      return `https://${network}.infura.io/v3/${config['INFURA_API_KEY']}`
  }
}

export const networkChainId = (network: EthereumNetworksTypes): number => {
  switch (network) {
    case 'mainnet':
      return 1

    case 'ropsten':
      return 3

    case 'goerli':
      return 5

    case 'kovan':
      return 42

    case 'mumbai':
      return 80001

    case 'polygon':
      return 137

    case 'polygon-zkevm':
      return 1101

    case 'arbitrum':
      return 42161

    case 'arbitrum-goerli':
      return 421613

    case 'arbitrum-nova':
      return 42170

    case 'optimism':
      return 10

    case 'bnb':
      return 56

    case 'bnb-testnet':
      return 97

    case 'gnosis':
      return 100

    case 'avalanche':
      return 43114

    case 'avalanche-fuji':
      return 43113
  }
}

export const networkConfig = (network: EthereumNetworksTypes): HttpNetworkConfig & { etherscan?: string } => {
  const prodConfig = getEnvConfig('PROD')
  const networkConfig = getEnvConfig(network)
  return {
    url: networkRpcUrl(network),
    chainId: networkChainId(network),
    accounts: {
      mnemonic: networkConfig['ETH_MNEMONIC'] ?? prodConfig['ETH_MNEMONIC'],
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
    etherscan: networkConfig['ETHERSCAN'] ?? prodConfig['ETHERSCAN']
  }
}

import * as dotenv from 'dotenv'
import * as path from 'path'
import { HttpNetworkConfig } from 'hardhat/types'
import { ethers } from 'ethers'

type EthereumNetworksTypes = 'ropsten' | 'kovan' | 'goerli' | 'mainnet' | 'mumbai' | 'polygon' | 'arbitrum' | 'arbitrum-goerli' | 'arbitrum-nova' | 'optimism' | 'bnb' | 'gnosis' | 'polygon-zkevm' | 'avalanche' | 'bnb-testnet' | 'avalanche-fuji'

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

    case 'arbitrum-goerli':
      return 'https://goerli-rollup.arbitrum.io/rpc'

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

    default:
      return `https://${network}.infura.io/v3/${config['INFURA_API_KEY']}`
  }
}

export const networkChainId = (network: EthereumNetworksTypes): number => {
  switch (network) {
    case 'mumbai':
      return 80001

    case 'ropsten':
      return 3

    case 'polygon':
      return 137

    case 'arbitrum-goerli':
      return 421613

    case 'arbitrum':
      return 42161

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

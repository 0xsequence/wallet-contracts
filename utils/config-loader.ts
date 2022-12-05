import * as dotenv from 'dotenv'
import * as path from 'path'
import { HttpNetworkConfig } from 'hardhat/types'
import { ethers } from 'ethers'

type EthereumNetworksTypes = 'rinkeby' | 'ropsten' | 'kovan' | 'goerli' | 'mainnet' | 'mumbai' | 'matic' | 'arbitrum' | 'arbitrum-testnet' | 'optimism' | 'metis' | 'nova' | 'avalanche' | 'avalanche-testnet'

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
    case 'arbitrum-testnet':
    case 'arbitrum':
      return 5

    default:
      return 1
  }
}

export const networkRpcUrl = (network: EthereumNetworksTypes): string => {
  const config = getEnvConfig('PROD')

  switch (network) {
    case 'mumbai':
      return 'https://rpc-mumbai.matic.today/'

    case 'matic':
      return 'https://nodes.sequence.app/matic'

    case 'arbitrum-testnet':
      return 'https://rinkeby.arbitrum.io/rpc'
    
    case 'arbitrum':
      return 'https://arb1.arbitrum.io/rpc'

    case 'optimism':
      return 'https://mainnet.optimism.io'

    case 'metis':
      return 'https://andromeda.metis.io/?owner=1088'

    case 'nova':
      return 'https://nova.arbitrum.io/rpc'

    case 'avalanche':
      return 'https://nodes.sequence.app/avalanche'

    case 'avalanche-testnet':
      return 'https://nodes.sequence.app/avalanche-testnet'

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

    case 'matic':
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

    case 'optimism':
      return 10

    case 'metis':
      return 1088

    case 'nova':
      return 42170

    case 'avalanche':
      return 43114

    case 'avalanche-testnet':
      return 43113
  }
}

export const etherscanKey = (network: EthereumNetworksTypes): string => {
  const config = getEnvConfig('PROD')

  if (network === 'mainnet') {
    return config['ETHERSCAN']
  } else {
    return config[`ETHERSCAN_${network.toUpperCase()}`]
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
      path: `m/44'/60'/0'/0`
    },
    gas: 'auto',
    gasPrice: 'auto',
    gasMultiplier: networkGasMultiplier(network),
    timeout: 20000,
    httpHeaders: {},
    etherscan: etherscanKey(network)
  }
}

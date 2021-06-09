import * as dotenv from 'dotenv'
import * as path from 'path'
import { HttpNetworkConfig } from 'hardhat/types'
import { ethers } from 'ethers'

type EthereumNetworksTypes = 'rinkeby' | 'ropsten' | 'kovan' | 'goerli' | 'mainnet' | 'mumbai' | 'matic' | 'arbitrum' | 'arbitrum-testnet'

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
    
    case 'ropsten':
      return "http://192.168.122.1:8546"

    case 'matic':
      return 'https://rpc-mainnet.matic.network'

    case 'arbitrum-testnet':
      return 'https://rinkeby.arbitrum.io/rpc'
    
    case 'arbitrum':
      return 'https://arb1.arbitrum.io/rpc'

    default:
      return `https://${network}.infura.io/v3/${config['INFURA_API_KEY']}`
  }
}

export const networkConfig = (network: EthereumNetworksTypes): HttpNetworkConfig & { etherscan?: string } => {
  const config = getEnvConfig('PROD')
  return {
    url: networkRpcUrl(network),
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
    etherscan: config['ETHERSCAN']
  }
}

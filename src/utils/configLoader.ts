import * as dotenv from 'dotenv'
import * as path from 'path'
import { HttpNetworkConfig } from '@nomiclabs/buidler/types'

type EthereumNetworksTypes =
  | 'rinkeby'
  | 'ropsten'
  | 'kovan'
  | 'goerli'
  | 'mainnet'
  | 'mumbai'
  | 'matic'

export const getEnvConfig = (env: string) => {
  if (env.includes('GANACHE')) {
    return {}
  }

  const envFile = path.resolve(__dirname, `../config/${env}.env`)
  const envLoad = dotenv.config({ path: envFile })

  if (envLoad.error) {
    throw new Error(envLoad.error.message)
  }

  return envLoad.parsed || {}
}

export const networkConfig = (
  network: EthereumNetworksTypes
): HttpNetworkConfig => {
  const config = getEnvConfig('PROD')

  if (!config) {
    throw new Error(`unable to load config: PROD`)
  }
  
  const networkConfig: HttpNetworkConfig = {
    url: (function(network) {
      switch(network) {
        case 'mumbai':
          return 'https://rpc-mumbai.matic.today/'

        case 'matic':
          return 'https://rpc-mainnet.matic.network'

        default:
          return `https://${network}.infura.io/v3/${config['INFURA_API_KEY']}`
      }
    })(network),
    accounts: {
      mnemonic: config['ETH_MNEMONIC']
    }
  }

  return networkConfig
}

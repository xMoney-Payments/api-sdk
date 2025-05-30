import type { XMoneySDK } from './factory'
import type { XMoneyConfig } from './types'
import { createXMoneyClientFactory } from './factory'
import { NodeHttpClient } from './http/node-client'
import { nodePlatformProvider } from './platform/node'

export function createXMoneyClient(config: XMoneyConfig | string): XMoneySDK {
  const finalConfig = typeof config === 'string'
    ? { apiKey: config, httpClient: new NodeHttpClient(), platformProvider: nodePlatformProvider }
    : {
        ...config,
        httpClient: config.httpClient || new NodeHttpClient(),
        platformProvider: config.platformProvider || nodePlatformProvider,
      }

  return createXMoneyClientFactory(finalConfig)
}

export { NodeHttpClient } from './http/node-client'
export * from './types'

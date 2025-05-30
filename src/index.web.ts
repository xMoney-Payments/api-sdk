import type { XMoneySDK } from './factory'
import type { XMoneyConfig } from './types'
import { createXMoneyClientFactory } from './factory'
import { FetchHttpClient } from './http/fetch-client'
import { webPlatformProvider } from './platform/web'

export function createXMoneyClient(config: XMoneyConfig | string): XMoneySDK {
  const finalConfig = typeof config === 'string'
    ? { apiKey: config, httpClient: new FetchHttpClient(), platformProvider: webPlatformProvider }
    : {
        ...config,
        httpClient: config.httpClient || new FetchHttpClient(),
        platformProvider: config.platformProvider || webPlatformProvider,
      }

  return createXMoneyClientFactory(finalConfig)
}

export { FetchHttpClient } from './http/fetch-client'
export * from './types'

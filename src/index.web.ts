import type { XMoneySDK } from './factory'
import type { XMoneyConfig } from './types'
import { createXMoneyClientWithHttpClient } from './factory'
import { FetchHttpClient } from './http/fetch-client'

export function createXMoneyClient(config: XMoneyConfig | string): XMoneySDK {
  const httpClient = typeof config === 'object' && config.httpClient
    ? config.httpClient
    : new FetchHttpClient()

  return createXMoneyClientWithHttpClient(config, httpClient)
}

export { FetchHttpClient } from './http/fetch-client'
export * from './types'

import type { XMoneySDK } from './factory'
import type { XMoneyConfig } from './types'
import { createXMoneyClientWithHttpClient } from './factory'
import { NodeHttpClient } from './http/node-client'

export function createXMoneyClient(config: XMoneyConfig | string): XMoneySDK {
  const httpClient = typeof config === 'object' && config.httpClient
    ? config.httpClient
    : new NodeHttpClient()

  return createXMoneyClientWithHttpClient(config, httpClient)
}

export { NodeHttpClient } from './http/node-client'
export * from './types'

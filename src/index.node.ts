import type { XMoneySDK } from './factory'
import type { XMoneyConfig } from './types'
import { createXMoneyClientFactory } from './factory'
import { NodeHttpClient } from './http'
import { nodePlatformProvider } from './platform/node'

/**
 * Create an XMoney SDK client for Node.js environments
 *
 * Automatically configures Node.js-specific HTTP and crypto implementations
 *
 * @param config - Configuration object or API key string
 * @returns XMoney SDK instance
 *
 * @example
 * ```typescript
 * import { createXMoneyClient } from '@xmoney/api-sdk'
 *
 * // Simple usage with API key only
 * const xMoney = createXMoneyClient('your-api-key')
 *
 * // Advanced configuration
 * const xMoney = createXMoneyClient({
 *   apiKey: 'your-api-key',
 *   secureToken: 'your-secure-token', // For card operations
 *   host: 'api.xmoney.com',
 *   timeout: 30000,
 *   maxRetries: 5
 * })
 *
 * // Use the SDK
 * const customer = await xMoney.customers.create({
 *   identifier: 'CUST-123',
 *   email: 'customer@example.com'
 * })
 * ```
 */
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

import type { XMoneySDK } from './factory'
import type { XMoneyConfig } from './types'
import { createXMoneyClientFactory } from './factory'
import { FetchHttpClient } from './http'
import { webPlatformProvider } from './platform/web'

/**
 * Create an XMoney SDK client for web browser environments
 *
 * Automatically configures browser-specific Fetch API and Web Crypto implementations
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
 *   host: 'api.xmoney.com',
 *   timeout: 30000,
 *   maxRetries: 3
 * })
 *
 * // Note: For PCI compliance, use hosted checkout for card payments
 * const checkout = xMoney.checkout.create({
 *   publicKey: 'pk_test_your-site-id',
 *   backUrl: window.location.origin + '/payment/complete',
 *   customer: { identifier: 'CUST-123', email: 'customer@example.com' },
 *   order: { orderId: 'ORDER-123', type: 'purchase', amount: 99.99, currency: 'USD', description: 'Purchase' }
 * })
 * ```
 */
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

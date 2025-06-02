import type { ApiResponse, RequestOptions, XMoneyConfig } from './types'
import { XMoneyClient } from './core'
import { CardsResource, CheckoutResource, CustomersResource, NotificationsResource, OrdersResource, TransactionsResource } from './resources'

/**
 * Main SDK interface providing access to all XMoney resources
 */
export interface XMoneySDK {
  /**
   * Customer management operations
   */
  customers: CustomersResource
  /**
   * Order management operations
   */
  orders: OrdersResource
  /**
   * Transaction management operations
   */
  transactions: TransactionsResource
  /**
   * Card management operations
   */
  cards: CardsResource
  /**
   * Notification webhook management
   */
  notifications: NotificationsResource
  /**
   * Checkout payment request operations
   */
  checkout: CheckoutResource
  /**
   * Direct API request method for custom endpoints
   * @param options - Request configuration
   * @returns API response
   */
  request: <T>(options: RequestOptions) => Promise<ApiResponse<T>>
}

/**
 * Internal factory function for creating XMoney SDK instances
 * Used by platform-specific entry points (Node.js and Web)
 *
 * @param config - Configuration object or API key string
 * @returns XMoney SDK instance with all resources
 * @throws {Error} If httpClient or platformProvider is not provided
 *
 * @internal
 */
export function createXMoneyClientFactory(config: XMoneyConfig | string): XMoneySDK {
  const finalConfig = typeof config === 'string'
    ? { apiKey: config }
    : config

  // Extract httpClient and platformProvider from config
  const httpClient = finalConfig.httpClient
  const platformProvider = finalConfig.platformProvider

  if (!httpClient) {
    throw new Error('httpClient is required')
  }
  if (!platformProvider) {
    throw new Error('platformProvider is required')
  }

  const client = new XMoneyClient({ ...finalConfig, httpClient, platformProvider })

  return {
    customers: new CustomersResource(client),
    orders: new OrdersResource(client),
    transactions: new TransactionsResource(client),
    cards: new CardsResource(client),
    notifications: new NotificationsResource(client),
    checkout: new CheckoutResource(client, platformProvider),
    request: client.request.bind(client),
  }
}

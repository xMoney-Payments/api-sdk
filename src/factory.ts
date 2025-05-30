import type { ApiResponse, RequestOptions, XMoneyConfig } from './types'
import { XMoneyClient } from './core/client'
import { CardsResource, CheckoutResource, CustomersResource, NotificationsResource, OrdersResource, TransactionsResource } from './resources'

export interface XMoneySDK {
  customers: CustomersResource
  orders: OrdersResource
  transactions: TransactionsResource
  cards: CardsResource
  notifications: NotificationsResource
  checkout: CheckoutResource
  request: <T>(options: RequestOptions) => Promise<ApiResponse<T>>
}

// Internal factory used by all entry points
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

import type { ApiResponse, HttpClient, RequestOptions, XMoneyConfig } from './types'
import { XMoneyClient } from './core/client'
import { CardsResource, CustomersResource, NotificationsResource, OrdersResource, TransactionsResource } from './resources'

export interface XMoneySDK {
  customers: CustomersResource
  orders: OrdersResource
  transactions: TransactionsResource
  cards: CardsResource
  notifications: NotificationsResource
  request: <T>(options: RequestOptions) => Promise<ApiResponse<T>>
}

// Internal factory used by all entry points
// This is typically in factory.ts file
export function createXMoneyClientWithHttpClient(config: XMoneyConfig | string, httpClient: HttpClient): XMoneySDK {
  const finalConfig = typeof config === 'string'
    ? { apiKey: config }
    : config

  const client = new XMoneyClient({ ...finalConfig, httpClient })

  return {
    customers: new CustomersResource(client),
    orders: new OrdersResource(client),
    transactions: new TransactionsResource(client),
    cards: new CardsResource(client),
    notifications: new NotificationsResource(client),
    request: client.request.bind(client),
  }
}

import type { ApiResponse, XMoneyCore } from '../types'
import type { CardType, RefundReason, Tag, WalletType } from './types'
import { XMoneyError } from '../core/error'
import { PaginatedList, SearchResult } from '../core/pagination'

export interface Order {
  id: number
  siteId?: number
  customerId: number
  externalOrderId?: string
  orderType: 'purchase' | 'recurring' | 'managed' | 'credit'
  orderStatus: 'start' | 'in-progress' | 'retrying' | 'expiring' | 'complete-ok' | 'complete-failed'
  amount?: number
  currency?: string
  description?: string
  invoiceEmail?: string
  createdAt?: string
  intervalType?: 'day' | 'month'
  intervalValue?: number
  retryPayment?: string
  nextDueDate?: string
  transactionMethod?: string
  tags?: Tag[]
}

export interface CreateOrderParams {
  siteId?: number
  customerId: number
  ip: string
  amount: number
  currency: string
  externalOrderId?: string
  force?: 0 | 1
  description?: string
  level3Data?: string
  invoiceEmail?: string
  tag?: string[]
  referenceOrderId?: number
  orderType: 'purchase' | 'recurring' | 'managed' | 'credit'
  intervalType?: 'day' | 'month'
  intervalValue?: number
  retryPayment?: string
  trialAmount?: number
  firstBillDate?: string
  backUrl?: string
  externalCustomData?: string
  transactionMethod?: 'card' | 'wallet'
  cardTransactionMode?: 'auth' | 'authAndCapture' | 'credit'
  cardId?: string
  cardHolderName?: string
  cardHolderCountry?: string
  cardHolderState?: string
  cardType?: CardType
  cardNumber?: string
  cardExpiryDate?: string
  cardCvv?: string
  cardDescriptor?: string
  threeDSecureData?: string
  saveCard?: boolean
  walletTransactionMode?: 'transfer' | 'credit'
  wallet?: WalletType
  walletExtraParams?: string
  transactionOption?: string
}

export interface CreateOrderResponse {
  orderId: number
  transactionId: number
  cardId?: number
  is3d?: 0 | 1
  isRedirect?: boolean
  redirect?: {
    url: string
    formMethod?: 'POST' | 'GET'
    params?: Record<string, any>
  }
}

export interface ListOrderParams {
  searchId?: string
  parentResourceType?: 'partner' | 'merchant' | 'site'
  parentResourceId?: number[]
  externalOrderId?: string
  customerId?: number
  orderType?: 'purchase' | 'recurring'
  orderStatus?: 'start' | 'in-progress' | 'retrying' | 'expiring' | 'complete-ok' | 'complete-failed'
  createdAtFrom?: string
  createdAtTo?: string
  reason?: RefundReason
  tag?: string
  page?: number
  perPage?: number
  reverseSorting?: 0 | 1
}

export class OrdersResource {
  constructor(private client: XMoneyCore) {}

  async create(params: CreateOrderParams): Promise<CreateOrderResponse> {
    const response = await this.client.request<CreateOrderResponse>({
      method: 'POST',
      path: '/order',
      body: params,
    })

    if (!response.data) {
      throw new XMoneyError('Failed to create order', {
        statusCode: response.code === 402 ? 402 : undefined,
      })
    }

    return response.data
  }

  async retrieve(id: string | number): Promise<Order> {
    const response = await this.client.request<Order>({
      method: 'GET',
      path: `/order/${id}`,
    })

    if (!response.data) {
      throw new XMoneyError('Order not found')
    }

    return response.data
  }

  async cancel(id: string | number, params?: {
    reason?: 'fraud-confirm' | 'highly-suspicious' | 'duplicated-transaction' | 'customer-demand' | 'test-transaction'
    message?: string
    terminateOrder?: 'yes'
  }): Promise<void> {
    await this.client.request({
      method: 'DELETE',
      path: `/order/${id}`,
      body: params,
    })
  }

  async rebill(id: string | number, params: {
    customerId: number
    amount: number
    transactionOption?: string
  }): Promise<{ id: number, transactionId?: number, cardId?: number }> {
    const response = await this.client.request<{ id: number, transactionId?: number, cardId?: number }>({
      method: 'PATCH',
      path: `/order-rebill/${id}`,
      body: params,
    })

    if (!response.data) {
      throw new XMoneyError('Failed to rebill order')
    }

    return response.data
  }

  async updateCard(orderId: string | number, params: {
    customerId: string | number
    ip: string
    amount: number
    currency: string
    transactionDescription?: string
    cardHolderName?: string
    cardHolderCountry?: string
    cardHolderState?: string
    cardType?: CardType
    cardNumber: string
    cardExpiryDate: string
    cardCvv: string
    cardDescriptor?: string
  }): Promise<{ id: number, transactionId?: number, cardId?: number }> {
    const response = await this.client.request<{ id: number, transactionId?: number, cardId?: number }>({
      method: 'PATCH',
      path: `/order-update-card/${orderId}`,
      body: params,
    })

    if (!response.data) {
      throw new XMoneyError('Failed to update card')
    }

    return response.data
  }

  async list(params?: ListOrderParams): Promise<PaginatedList<Order>> {
    const response = await this.client.request<Order[]>({
      method: 'GET',
      path: '/order',
      query: params,
    })

    // Create a fetch function for pagination
    const fetchNextPage = async (page: number): Promise<ApiResponse<Order[]>> => {
      return this.client.request<Order[]>({
        method: 'GET',
        path: '/order',
        query: { ...params, page },
      })
    }

    return new PaginatedList(
      response.data || [],
      response.pagination,
      response.searchParams,
      fetchNextPage,
    )
  }

  async search(params: Omit<ListOrderParams, 'searchId' | 'page'>): Promise<SearchResult<Order>> {
    const response = await this.client.request<{ searchId: string, url?: string }>({
      method: 'POST',
      path: '/order-search',
      body: params,
    })

    if (!response.data?.searchId) {
      throw new XMoneyError('Search failed')
    }

    return new SearchResult(response.data.searchId, () => this.list({ searchId: response.data!.searchId }))
  }
}

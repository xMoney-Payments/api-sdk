import type { ApiResponse, RefundReason, XMoneyCore } from '../types'
import type { CardType, Tag, WalletType } from './types'
import { PaginatedList, SearchResult, XMoneyError } from '../core'

/**
 * Order information in XMoney
 */
export interface Order {
  /**
   * Unique order ID
   */
  id: number
  /**
   * Site ID the order belongs to
   */
  siteId?: number
  /**
   * Customer ID associated with the order
   */
  customerId: number
  /**
   * External reference ID for the order
   */
  externalOrderId?: string
  /**
   * Type of order
   * - purchase: One-time payment
   * - recurring: Subscription payment
   * - managed: Managed recurring payment
   * - credit: Credit/refund transaction
   */
  orderType: 'purchase' | 'recurring' | 'managed' | 'credit'
  /**
   * Current order status
   * - start: Order initiated
   * - in-progress: Processing payment
   * - retrying: Retrying failed payment
   * - expiring: Subscription expiring
   * - complete-ok: Successfully completed
   * - complete-failed: Failed to complete
   */
  orderStatus: 'start' | 'in-progress' | 'retrying' | 'expiring' | 'complete-ok' | 'complete-failed'
  /**
   * Order amount
   */
  amount?: number
  /**
   * Currency code (ISO 4217)
   */
  currency?: string
  /**
   * Order description
   */
  description?: string
  /**
   * Email for invoice delivery
   */
  invoiceEmail?: string
  /**
   * ISO 8601 date-time when order was created
   */
  createdAt?: string
  /**
   * Recurring interval type
   */
  intervalType?: 'day' | 'month'
  /**
   * Recurring interval value
   */
  intervalValue?: number
  /**
   * Retry intervals for failed payments (comma-separated ISO 8601 durations)
   */
  retryPayment?: string
  /**
   * ISO 8601 date-time for next payment due
   */
  nextDueDate?: string
  /**
   * Payment method used
   */
  transactionMethod?: 'card' | 'wallet' | string
  /**
   * Order tags for categorization
   */
  tags?: Tag[]
}

/**
 * Parameters for creating a new order
 */
export interface OrderCreateParams {
  /**
   * Site ID for the order
   */
  siteId?: number
  /**
   * Customer ID (required)
   */
  customerId: number
  /**
   * Customer IP address (required)
   */
  ip: string
  /**
   * Order amount (required)
   */
  amount: number
  /**
   * Currency code ISO 4217 (required)
   */
  currency: string
  /**
   * External order reference ID
   */
  externalOrderId?: string
  /**
   * Force transaction (1 = force, 0 = normal)
   */
  force?: 0 | 1
  /**
   * Order description
   */
  description?: string
  /**
   * Level 3 processing data (JSON)
   */
  level3Data?: string
  /**
   * Email for invoice delivery
   */
  invoiceEmail?: string
  /**
   * Tags to assign to the order
   */
  tag?: string[]
  /**
   * Reference to another order ID
   */
  referenceOrderId?: number
  /**
   * Order type (required)
   */
  orderType: 'purchase' | 'recurring' | 'managed' | 'credit'
  /**
   * Recurring interval type
   */
  intervalType?: 'day' | 'month'
  /**
   * Recurring interval value
   */
  intervalValue?: number
  /**
   * Retry payment schedule (ISO 8601 durations)
   */
  retryPayment?: string
  /**
   * Trial period amount
   */
  trialAmount?: number
  /**
   * First billing date for recurring orders
   */
  firstBillDate?: string
  /**
   * URL to redirect after payment
   */
  backUrl?: string
  /**
   * Custom data to attach to order
   */
  externalCustomData?: string
  /**
   * Payment method type
   */
  transactionMethod?: 'card' | 'wallet'
  /**
   * Card transaction mode
   * - auth: Authorization only
   * - authAndCapture: Authorize and capture
   * - credit: Credit/refund
   */
  cardTransactionMode?: 'auth' | 'authAndCapture' | 'credit'
  /**
   * Existing card ID to use
   */
  cardId?: string
  /**
   * Cardholder name
   */
  cardHolderName?: string
  /**
   * Cardholder country (ISO 3166-1 alpha-2)
   */
  cardHolderCountry?: string
  /**
   * Cardholder state
   */
  cardHolderState?: string
  /**
   * Card type
   */
  cardType?: CardType
  /**
   * Card number (PAN)
   */
  cardNumber?: string
  /**
   * Card expiry date (MM/YY or MM/YYYY)
   */
  cardExpiryDate?: string
  /**
   * Card security code (CVV/CVC)
   */
  cardCvv?: string
  /**
   * Statement descriptor
   */
  cardDescriptor?: string
  /**
   * 3D Secure authentication data
   */
  threeDSecureData?: string
  /**
   * Save card for future use
   */
  saveCard?: boolean
  /**
   * Wallet transaction mode
   */
  walletTransactionMode?: 'transfer' | 'credit'
  /**
   * Wallet type
   */
  wallet?: WalletType
  /**
   * Extra wallet parameters (JSON)
   */
  walletExtraParams?: string
  /**
   * Transaction options (JSON)
   */
  transactionOption?: string
}

/**
 * Response from order creation
 */
export interface CreateOrderResponse {
  /**
   * Created order ID
   */
  orderId: number
  /**
   * Created transaction ID
   */
  transactionId: number
  /**
   * Saved card ID if card was saved
   */
  cardId?: number
  /**
   * Whether 3D Secure is required (1 = yes, 0 = no)
   */
  is3d?: 0 | 1
  /**
   * Whether redirect is required
   */
  isRedirect?: boolean
  /**
   * Redirect information if required
   */
  redirect?: {
    /**
     * URL to redirect to
     */
    url: string
    /**
     * HTTP method for redirect
     */
    formMethod?: 'POST' | 'GET'
    /**
     * Parameters to include in redirect
     */
    params?: Record<string, any>
  }
}

/**
 * Parameters for listing and filtering orders
 */
export interface OrderListParams {
  /**
   * Search ID from previous search
   */
  searchId?: string
  /**
   * Filter by parent resource type
   */
  parentResourceType?: 'partner' | 'merchant' | 'site'
  /**
   * Filter by parent resource IDs
   */
  parentResourceId?: number[]
  /**
   * Filter by external order ID
   */
  externalOrderId?: string
  /**
   * Filter by customer ID
   */
  customerId?: number
  /**
   * Filter by order type
   */
  orderType?: 'purchase' | 'recurring'
  /**
   * Filter by order status
   */
  orderStatus?: 'start' | 'in-progress' | 'retrying' | 'expiring' | 'complete-ok' | 'complete-failed'
  /**
   * Filter by creation date (from)
   */
  createdAtFrom?: Date
  /**
   * Filter by creation date (to)
   */
  createdAtTo?: Date
  /**
   * Filter by refund reason
   */
  reason?: RefundReason
  /**
   * Filter by tag
   */
  tag?: string
  /**
   * Page number
   */
  page?: number
  /**
   * Items per page
   */
  perPage?: number
  /**
   * Reverse sort order (1 = reverse)
   */
  reverseSorting?: 0 | 1
}

/**
 * Parameters for rebilling an order
 */
export interface OrderRebillParams {
  /**
   * Customer ID for the rebill
   */
  customerId: number
  /**
   * Rebill amount
   */
  amount: number
  /**
   * Transaction options (JSON)
   * Validate against https://api-stage.xmoney.com/schema/transactionOption.schema.json
   */
  transactionOption?: string
}

/**
 * Parameters for updating card on an order
 */
export interface OrderUpdateCardParams {
  /**
   * Customer ID
   */
  customerId: string
  /**
   * Customer IP address
   */
  ip: string
  /**
   * Transaction amount
   */
  amount: number
  /**
   * Currency code (ISO 4217)
   */
  currency: string
  /**
   * Transaction description
   */
  transactionDescription?: string
  /**
   * Cardholder name
   */
  cardHolderName?: string
  /**
   * Cardholder country (ISO 3166-1 alpha-2)
   */
  cardHolderCountry?: string
  /**
   * Cardholder state
   */
  cardHolderState?: string
  /**
   * Card type
   */
  cardType?: CardType
  /**
   * Card number (required)
   */
  cardNumber: string
  /**
   * Card expiry date (required, MM/YY or MM/YYYY)
   */
  cardExpiryDate: string
  /**
   * Card security code (required)
   */
  cardCvv: string
  /**
   * Statement descriptor
   */
  cardDescriptor?: string
}

/**
 * Parameters for canceling an order
 */
export interface OrderCancelParams {
  /**
   * Cancellation reason
   */
  reason?: 'fraud-confirm' | 'highly-suspicious' | 'duplicated-transaction' | 'customer-demand' | 'test-transaction'
  /**
   * Additional cancellation message
   */
  message?: string
  /**
   * Set to 'yes' to terminate recurring orders
   */
  terminateOrder?: 'yes'
}

/**
 * Resource for managing orders in XMoney
 *
 * @example
 * ```typescript
 * const xMoney = createXMoneyClient({ apiKey: 'your-api-key' })
 *
 * // Create a one-time purchase
 * const order = await xMoney.orders.create({
 *   customerId: 123,
 *   ip: '192.168.1.1',
 *   amount: 99.99,
 *   currency: 'USD',
 *   orderType: 'purchase',
 *   transactionMethod: 'card',
 *   cardNumber: '4111111111111111',
 *   cardExpiryDate: '12/25',
 *   cardCvv: '123'
 * })
 *
 * // Handle 3D Secure redirect if needed
 * if (order.isRedirect && order.redirect) {
 *   // Redirect user to order.redirect.url
 * }
 * ```
 */
export class OrdersResource {
  constructor(private client: XMoneyCore) {}

  /**
   * Create a new order
   * @param params - Order creation parameters
   * @returns Order creation response with IDs and redirect info
   * @throws {XMoneyError} If creation fails (402 for payment failure)
   */
  async create(params: OrderCreateParams): Promise<CreateOrderResponse> {
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

  /**
   * Retrieve an order by ID
   * @param id - Order ID or external order ID
   * @returns Order information
   * @throws {XMoneyError} If order not found
   */
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

  /**
   * Cancel an order
   * @param id - Order ID or external order ID
   * @param params - Cancellation parameters
   * @throws {XMoneyError} If cancellation fails
   */
  async cancel(id: string | number, params?: OrderCancelParams): Promise<void> {
    await this.client.request({
      method: 'DELETE',
      path: `/order/${id}`,
      body: params,
    })
  }

  /**
   * Rebill an existing order
   * @param id - Order ID or external order ID
   * @param params - Rebill parameters
   * @returns New order and transaction IDs
   * @throws {XMoneyError} If rebill fails
   */
  async rebill(id: string | number, params: OrderRebillParams): Promise<{ id: number, transactionId?: number, cardId?: number }> {
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

  /**
   * Update payment card for an order
   * @param orderId - Order ID or external order ID
   * @param params - New card information
   * @returns Updated order and card IDs
   * @throws {XMoneyError} If update fails
   */
  async updateCard(orderId: string | number, params: OrderUpdateCardParams): Promise<{ id: number, transactionId?: number, cardId?: number }> {
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

  /**
   * List orders with optional filtering
   * @param params - List parameters
   * @returns Paginated list of orders
   *
   * @example
   * ```typescript
   * // List all orders for a customer
   * const orders = await xMoney.orders.list({
   *   customerId: 123,
   *   orderStatus: 'complete-ok'
   * })
   *
   * // Iterate through pages
   * for await (const order of orders) {
   *   console.log(order.amount, order.currency)
   * }
   * ```
   */
  async list(params?: OrderListParams): Promise<PaginatedList<Order>> {
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

  /**
   * Search orders with advanced filtering
   * @param params - Search parameters
   * @returns Search result for fetching orders
   * @throws {XMoneyError} If search fails
   *
   * @example
   * ```typescript
   * const search = await xMoney.orders.search({
   *   createdAtFrom: new Date('2024-01-01'),
   *   orderType: 'recurring'
   * })
   * const results = await search.fetch()
   * ```
   */
  async search(params: Omit<OrderListParams, 'searchId' | 'page'>): Promise<SearchResult<Order>> {
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

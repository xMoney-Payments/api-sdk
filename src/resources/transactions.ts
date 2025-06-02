import type { ApiResponse, Card, CardProvider, WalletProvider, XMoneyCore } from '../types'
import type { CardType, RefundReason, WalletBrand } from './types'
import { PaginatedList, SearchResult, XMoneyError } from '../core'

/**
 * Transaction status values
 */
export type TransactionStatus =
  | 'start'
  | 'in-progress'
  | 'complete-ok'
  | 'complete-failed'
  | 'cancel-ok'
  | 'refund-ok'
  | 'void-ok'
  | 'charge-back'
  | '3d-pending'

/**
 * Transaction component details from payment provider
 */
export interface TransactionComponent {
  /**
   * Component ID
   */
  componentId: number
  /**
   * Component type
   */
  componentType: string
  /**
   * ISO 8601 date-time of component
   */
  componentDate: string
  /**
   * Unix timestamp
   */
  componentTimestamp: number
  /**
   * Provider internal reference
   */
  providerIntRef?: string
  /**
   * Provider response code
   */
  providerRc?: string
  /**
   * Provider response message
   */
  providerMessage?: string
  /**
   * Provider authorization code
   */
  providerAuth?: string
  /**
   * Provider retrieval reference number
   */
  providerRrn?: string
  /**
   * Provider acquirer reference number
   */
  providerArn?: string
  /**
   * Provider issuer reference data
   */
  providerIrd?: string
  /**
   * Provider electronic commerce indicator
   */
  providerEci?: string
  /**
   * Provider cavv/xid
   */
  providerC?: string
  /**
   * Additional provider data
   */
  data?: Record<string, any>
}

/**
 * Transaction summary information
 */
export interface TransactionSummary {
  /**
   * Transaction ID
   */
  id: number
  /**
   * Site ID
   */
  siteId?: number
  /**
   * Associated order ID
   */
  orderId: number
  /**
   * Associated customer ID
   */
  customerId: number
  /**
   * Transaction type
   */
  transactionType: 'deposit' | 'refund' | 'credit' | 'chargeback' | 'representment'
  /**
   * Payment method used
   */
  transactionMethod: 'card' | 'wallet' | 'transfer'
  /**
   * Current transaction status
   */
  transactionStatus: TransactionStatus
  /**
   * Customer IP address
   */
  ip: string
  /**
   * Transaction amount
   */
  amount: string
  /**
   * Currency code (ISO 4217)
   */
  currency: string
  /**
   * Amount converted to EUR
   */
  amountInEur: string
  /**
   * Transaction description
   */
  description: string
  /**
   * Customer country code
   */
  customerCountry: string
  /**
   * ISO 8601 creation date-time
   */
  creationDate: string
  /**
   * Unix timestamp of creation
   */
  creationTimestamp: number
  /**
   * Source of transaction
   */
  transactionSource: 'service-call' | 're-bill' | 're-bill-micro' | 'card-change'
  /**
   * Admin user ID if applicable
   */
  adminId?: number
  /**
   * Fraud risk score
   */
  fraudScore?: number
  /**
   * Card provider ID
   */
  cardProviderId?: number
  /**
   * Card provider name
   */
  cardProvider?: string
  /**
   * Cardholder name
   */
  cardHolderName?: string
  /**
   * Card provider display name
   */
  cardProviderName?: string
  /**
   * Cardholder country
   */
  cardHolderCountry?: string
  /**
   * Cardholder state
   */
  cardHolderState?: string
  /**
   * Card type
   */
  cardType?: string
  /**
   * Masked card number
   */
  cardNumber?: string
  /**
   * Card expiry date
   */
  cardExpiryDate?: string
  /**
   * Customer email
   */
  email?: string
  /**
   * Saved card ID
   */
  cardId?: number
  /**
   * Return URL after payment
   */
  backUrl?: string
  /**
   * Custom data attached to transaction
   */
  externalCustomData?: string
  /**
   * Statement descriptor
   */
  cardDescriptor?: string
}

/**
 * Full transaction details including related data
 */
export interface Transaction extends TransactionSummary {
  /**
   * Parent transaction ID for refunds/chargebacks
   */
  parentTransactionId?: number
  /**
   * Related transaction IDs
   */
  relatedTransactionIds?: number[]
  /**
   * Card details if applicable
   */
  card?: Card
  /**
   * Transaction component details from providers
   */
  components?: TransactionComponent[]
}

/**
 * Parameters for listing and filtering transactions
 */
export interface TransactionListParams {
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
   * Filter by order ID
   */
  orderId?: number
  /**
   * Filter by customer ID
   */
  customerId?: number
  /**
   * Filter by email
   */
  email?: string
  /**
   * Filter by transaction method
   */
  transactionMethod?: 'card' | 'wallet' | 'transfer'
  /**
   * Filter by currency
   */
  currency?: string
  /**
   * Filter by minimum amount
   */
  amountFrom?: number
  /**
   * Filter by maximum amount
   */
  amountTo?: number
  /**
   * Filter by transaction type
   */
  transactionType?: 'deposit' | 'refund' | 'credit' | 'chargeback' | 'representment'
  /**
   * Filter by transaction status
   */
  transactionStatus?: TransactionStatus[]
  /**
   * Date field to filter by
   */
  dateType?: 'creation' | 'approval' | 'refund' | 'cancellation' | 'charge-back'
  /**
   * Filter by date from
   */
  createdAtFrom?: Date
  /**
   * Filter by date to
   */
  createdAtTo?: Date
  /**
   * Filter transactions with ID greater than
   */
  greaterThanId?: number
  /**
   * Filter by transaction source
   */
  source?: Array<'service-call' | 're-bill' | 're-bill-micro' | 'card-change'>
  /**
   * Filter by IP address
   */
  ip?: string
  /**
   * Filter by minimum fraud score
   */
  fraudScoreGreaterThan?: number
  /**
   * Filter by refund reason
   */
  reason?: RefundReason
  /**
   * Filter by user ID
   */
  userId?: number
  /**
   * Page number
   */
  page?: number
  /**
   * Items per page
   */
  perPage?: number
  /**
   * Reverse sort order
   */
  reverseSorting?: 0 | 1
  /**
   * Filter by card provider
   */
  cardProvider?: CardProvider
  /**
   * Filter by card type
   */
  cardType?: CardType
  /**
   * Filter by card number (partial)
   */
  cardNumber?: string
  /**
   * Filter by cardholder name
   */
  cardHolderName?: string
  /**
   * Filter by country
   */
  country?: string
  /**
   * Filter by state
   */
  state?: string
  /**
   * Filter by wallet provider
   */
  walletProvider?: WalletProvider
  /**
   * Filter by wallet brand
   */
  walletBrand?: WalletBrand
  /**
   * Filter by wallet holder name
   */
  walletHolderName?: string
  /**
   * Filter by wallet holder email
   */
  walletHolderEmail?: string
  /**
   * Filter by initial transaction ID
   */
  initialTransactionId?: number
}

/**
 * Parameters for capturing an authorized transaction
 */
export interface TransactionCaptureParams {
  /**
   * Amount to capture
   */
  amount: number
}

/**
 * Parameters for refunding a transaction
 */
export interface TransactionRefundParams {
  /**
   * Refund reason
   */
  reason?: RefundReason
  /**
   * Additional refund message
   */
  message?: string
  /**
   * Partial refund amount (full refund if not specified)
   */
  amount?: number
  /**
   * Transaction options (JSON)
   */
  transactionOption?: string
}

/**
 * Resource for managing transactions in XMoney
 *
 * @example
 * ```typescript
 * const xMoney = createXMoney({ apiKey: 'your-api-key' })
 *
 * // Get transaction details
 * const transaction = await xMoney.transactions.retrieve(12345)
 * console.log(transaction.amount, transaction.transactionStatus)
 *
 * // Refund a transaction
 * await xMoney.transactions.refund(12345, {
 *   reason: 'customer-demand',
 *   amount: 50.00 // partial refund
 * })
 * ```
 */
export class TransactionsResource {
  constructor(private client: XMoneyCore) {}

  /**
   * Retrieve transaction details
   * @param id - Transaction ID
   * @returns Full transaction information
   * @throws {XMoneyError} If transaction not found
   */
  async retrieve(id: number): Promise<Transaction> {
    const response = await this.client.request<Transaction>({
      method: 'GET',
      path: `/transaction/${id}`,
    })

    if (!response.data) {
      throw new XMoneyError('Transaction not found')
    }

    return response.data
  }

  /**
   * Capture an authorized transaction
   * @param id - Transaction ID
   * @param params - Capture parameters
   * @throws {XMoneyError} If capture fails
   */
  async capture(id: number, params: TransactionCaptureParams): Promise<void> {
    await this.client.request({
      method: 'PUT',
      path: `/transaction/${id}`,
      body: params,
    })
  }

  /**
   * Refund a transaction
   * @param id - Transaction ID
   * @param params - Refund parameters (optional for full refund)
   * @throws {XMoneyError} If refund fails
   */
  async refund(id: number, params?: TransactionRefundParams): Promise<void> {
    await this.client.request({
      method: 'DELETE',
      path: `/transaction/${id}`,
      body: params,
    })
  }

  /**
   * List transactions with filtering
   * @param params - List parameters
   * @returns Paginated list of transaction summaries
   *
   * @example
   * ```typescript
   * // List recent successful transactions
   * const transactions = await xMoney.transactions.list({
   *   transactionStatus: ['complete-ok'],
   *   createdAtFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
   * })
   *
   * for await (const tx of transactions) {
   *   console.log(tx.id, tx.amount, tx.currency)
   * }
   * ```
   */
  async list(params?: TransactionListParams): Promise<PaginatedList<TransactionSummary>> {
    const response = await this.client.request<TransactionSummary[]>({
      method: 'GET',
      path: '/transaction',
      query: params,
    })

    // Create a fetch function for pagination
    const fetchNextPage = async (page: number): Promise<ApiResponse<TransactionSummary[]>> => {
      return this.client.request<TransactionSummary[]>({
        method: 'GET',
        path: '/transaction',
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
   * Search transactions with advanced filtering
   * @param params - Search parameters
   * @returns Search result for fetching transactions
   * @throws {XMoneyError} If search fails
   *
   * @example
   * ```typescript
   * const search = await xMoney.transactions.search({
   *   amountFrom: 100,
   *   amountTo: 1000,
   *   transactionType: 'deposit'
   * })
   * const results = await search.getResults()
   * ```
   */
  async search(params: Omit<TransactionListParams, 'searchId' | 'page'>): Promise<SearchResult<TransactionSummary>> {
    const response = await this.client.request<{ searchId: string, url?: string }>({
      method: 'POST',
      path: '/transaction-search',
      body: params,
    })

    if (!response.data?.searchId) {
      throw new XMoneyError('Search failed')
    }

    return new SearchResult(response.data.searchId, () => this.list({ searchId: response.data!.searchId }))
  }
}

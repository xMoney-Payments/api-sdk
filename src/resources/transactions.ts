import type { ApiResponse, Card, CardProvider, WalletProvider, XMoneyCore } from '../types'
import type { CardType, RefundReason, WalletBrand } from './types'
import { XMoneyError } from '../core/error'
import { PaginatedList, SearchResult } from '../core/pagination'

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

export interface TransactionComponent {
  componentId: number
  componentType: string
  componentDate: string // ISO 8601 date-time
  componentTimestamp: number
  providerIntRef?: string
  providerRc?: string
  providerMessage?: string
  providerAuth?: string
  providerRrn?: string
  providerArn?: string
  providerIrd?: string
  providerEci?: string
  providerC?: string
  data?: Record<string, any>
}

export interface TransactionSummary {
  id: number
  siteId?: number
  orderId: number
  customerId: number
  transactionType: 'deposit' | 'refund' | 'credit' | 'chargeback' | 'representment'
  transactionMethod: 'card' | 'wallet' | 'transfer'
  transactionStatus: TransactionStatus
  ip: string
  amount: string
  currency: string
  amountInEur: string
  description: string
  customerCountry: string
  creationDate: string // ISO 8601 date-time
  creationTimestamp: number
  transactionSource: 'service-call' | 're-bill' | 're-bill-micro' | 'card-change'
  adminId?: number
  fraudScore?: number
  cardProviderId?: number
  cardProvider?: string
  cardProviderName?: string
  cardHolderName?: string
  cardHolderCountry?: string
  cardHolderState?: string
  cardType?: string
  cardNumber?: string
  cardExpiryDate?: string
  email?: string
  cardId?: number
  backUrl?: string
  externalCustomData?: string
  cardDescriptor?: string
}

export interface Transaction extends TransactionSummary {
  parentTransactionId?: number
  relatedTransactionIds?: number[]
  card?: Card
  components?: TransactionComponent[]
}

export interface TransactionListParams {
  searchId?: string
  parentResourceType?: 'partner' | 'merchant' | 'site'
  parentResourceId?: number[]
  orderId?: number
  customerId?: number
  email?: string
  transactionMethod?: 'card' | 'wallet' | 'transfer'
  currency?: string
  amountFrom?: number
  amountTo?: number
  transactionType?: 'deposit' | 'refund' | 'credit' | 'chargeback' | 'representment'
  transactionStatus?: TransactionStatus[]
  dateType?: 'creation' | 'approval' | 'refund' | 'cancellation' | 'charge-back'
  createdAtFrom?: string
  createdAtTo?: string
  greaterThanId?: number
  source?: Array<'service-call' | 're-bill' | 're-bill-micro' | 'card-change'>
  ip?: string
  fraudScoreGreaterThan?: number
  reason?: RefundReason
  userId?: number
  page?: number
  perPage?: number
  reverseSorting?: 0 | 1
  cardProvider?: CardProvider
  cardType?: CardType
  cardNumber?: string
  cardHolderName?: string
  country?: string
  state?: string
  walletProvider?: WalletProvider
  walletBrand?: WalletBrand
  walletHolderName?: string
  walletHolderEmail?: string
  initialTransactionId?: number
}

export interface TransactionCaptureParams {
  amount: number
}

export interface TransactionRefundParams {
  reason?: RefundReason
  message?: string
  amount?: number
  transactionOption?: string
}

export class TransactionsResource {
  constructor(private client: XMoneyCore) {}

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

  async capture(id: number, params: TransactionCaptureParams): Promise<void> {
    await this.client.request({
      method: 'PUT',
      path: `/transaction/${id}`,
      body: params,
    })
  }

  async refund(id: number, params?: TransactionRefundParams): Promise<void> {
    await this.client.request({
      method: 'DELETE',
      path: `/transaction/${id}`,
      body: params,
    })
  }

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

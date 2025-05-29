import type { ApiResponse, XMoneyCore } from '../types'
import type { Card } from './cards'
import type { CardType, RefundReason, WalletType } from './types'
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

export interface Transaction {
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
  creationDate: string
  creationTimestamp: number
  transactionSource: 'service-call' | 're-bill' | 're-bill-micro' | 'card-change'
  parentTransactionId?: number
  adminId?: number
  fraudScore?: number
  relatedTransactionIds?: number[]
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
  cardDescriptor?: string
  card?: Card
  components?: TransactionComponent[]
}

export interface TransactionComponent {
  componentId: number
  componentType: string
  componentDate: string
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

export interface ListTransactionParams {
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
  cardProvider?: string
  cardType?: CardType
  cardNumber?: string
  cardHolderName?: string
  country?: string
  state?: string
  walletProvider?: string
  walletBrand?: WalletType
  walletHolderName?: string
  walletHolderEmail?: string
  initialTransactionId?: number
}

export interface TransactionSummary extends Omit<Transaction, 'parentTransactionId' | 'relatedTransactionIds' | 'card' | 'components'> {}

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

  async capture(id: number, amount: number): Promise<void> {
    await this.client.request({
      method: 'PUT',
      path: `/transaction/${id}`,
      body: { amount },
    })
  }

  async refund(id: number, params?: {
    reason?: RefundReason
    message?: string
    amount?: number
    transactionOption?: string
  }): Promise<void> {
    await this.client.request({
      method: 'DELETE',
      path: `/transaction/${id}`,
      body: params,
    })
  }

  async list(params?: ListTransactionParams): Promise<PaginatedList<TransactionSummary>> {
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

  async search(params: Omit<ListTransactionParams, 'searchId' | 'page'>): Promise<SearchResult<TransactionSummary>> {
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

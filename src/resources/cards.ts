import type { ApiResponse, XMoneyCore } from '../types'
import { XMoneyError } from '../core/error'
import { PaginatedList } from '../core/pagination'

export interface Card {
  id: number
  customerId: number
  type: string
  cardNumber: string
  expiryMonth: string
  expiryYear: string
  nameOnCard?: string
  cardHolderCountry?: string
  cardHolderState?: string
  cardProvider: string
  hasToken?: boolean
  cardStatus: string
  binInfo?: BinInfo
}

export interface BinInfo {
  bin: string
  brand?: string
  type?: string
  level?: string
  countryCode?: string
  bank?: string
}

export interface CardListParams {
  searchId?: string
  customerId?: number
  orderId?: number
  hasToken?: 'yes' | 'no'
  cardStatus?: 'all' | 'deleted'
  page?: number
  perPage?: number
  reverseSorting?: 0 | 1
}

export class CardsResource {
  constructor(private client: XMoneyCore) {}

  async retrieve(id: number, customerId: number): Promise<Card> {
    const response = await this.client.request<Card>({
      method: 'GET',
      path: `/card/${id}`,
      query: { customerId },
    })

    if (!response.data) {
      throw new XMoneyError('Card not found')
    }

    return response.data
  }

  async delete(id: number): Promise<void> {
    await this.client.request({
      method: 'DELETE',
      path: `/card/${id}`,
    })
  }

  async list(params?: CardListParams): Promise<PaginatedList<Card>> {
    const response = await this.client.request<Card[]>({
      method: 'GET',
      path: '/card',
      query: params,
    })

    // Create a fetch function for pagination
    const fetchNextPage = async (page: number): Promise<ApiResponse<Card[]>> => {
      return this.client.request<Card[]>({
        method: 'GET',
        path: '/card',
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
}

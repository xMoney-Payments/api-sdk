import type { ApiResponse, XMoneyCore } from '../types'
import type { Tag } from './types'
import { XMoneyError } from '../core/error'
import { PaginatedList, SearchResult } from '../core/pagination'

export interface Customer {
  id: number
  siteId?: number
  identifier: string
  firstName: string
  lastName: string
  country: string
  state?: string
  city: string
  zipCode: string
  address: string
  phone: string
  email: string
  isWhitelisted?: number
  isWhitelistedUntil?: string
  creationDate: string
  creationTimestamp: number
  tags?: Tag[]
}

export interface CreateCustomerParams {
  identifier: string
  email: string
  siteId?: number
  firstName?: string
  lastName?: string
  country?: string
  state?: string
  city?: string
  zipCode?: string
  address?: string
  phone?: string
  isWhitelisted?: 0 | 1
  isWhitelistedUntil?: string
  tag?: string[]
}

export interface UpdateCustomerParams extends Partial<Omit<CreateCustomerParams, 'siteId'>> {}

export interface ListCustomerParams {
  searchId?: string
  identifier?: string
  identifierMatchPartial?: 0 | 1
  parentResourceType?: 'partner' | 'merchant' | 'site'
  parentResourceId?: number[]
  email?: string
  isWhitelisted?: 0 | 1
  isWhitelistedUntilFrom?: string
  isWhitelistedUntilTo?: string
  tag?: string
  country?: string
  state?: string
  createdAtFrom?: string
  createdAtTo?: string
  page?: number
  perPage?: number
  reverseSorting?: 0 | 1
}

export class CustomersResource {
  constructor(private client: XMoneyCore) {}

  async create(params: CreateCustomerParams): Promise<{ id: number }> {
    const response = await this.client.request<{ id: number }>({
      method: 'POST',
      path: '/customer',
      body: params,
    })

    if (!response.data) {
      throw new XMoneyError('Failed to create customer')
    }

    return response.data
  }

  async retrieve(id: number): Promise<Customer> {
    const response = await this.client.request<Customer>({
      method: 'GET',
      path: `/customer/${id}`,
    })

    if (!response.data) {
      throw new XMoneyError('Customer not found')
    }

    return response.data
  }

  async update(id: number, params: UpdateCustomerParams): Promise<void> {
    await this.client.request({
      method: 'PUT',
      path: `/customer/${id}`,
      body: params,
    })
  }

  async delete(id: number): Promise<void> {
    await this.client.request({
      method: 'DELETE',
      path: `/customer/${id}`,
    })
  }

  async list(params?: ListCustomerParams): Promise<PaginatedList<Customer>> {
    const response = await this.client.request<Customer[]>({
      method: 'GET',
      path: '/customer',
      query: params,
    })

    // Create a fetch function for pagination
    const fetchNextPage = async (page: number): Promise<ApiResponse<Customer[]>> => {
      return this.client.request<Customer[]>({
        method: 'GET',
        path: '/customer',
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

  async search(params: Omit<ListCustomerParams, 'searchId' | 'page'>): Promise<SearchResult<Customer>> {
    const response = await this.client.request<{ searchId: string, url?: string }>({
      method: 'POST',
      path: '/customer-search',
      body: params,
    })

    if (!response.data?.searchId) {
      throw new XMoneyError('Search failed')
    }

    return new SearchResult(response.data.searchId, () => this.list({ searchId: response.data!.searchId }))
  }
}

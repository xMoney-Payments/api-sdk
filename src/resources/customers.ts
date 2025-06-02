import type { ApiResponse, XMoneyCore } from '../types'
import type { Tag } from './types'
import { PaginatedList, SearchResult, XMoneyError } from '../core'

/**
 * Customer information stored in XMoney
 */
export interface Customer {
  /**
   * Unique customer ID
   */
  id: number
  /**
   * Site ID the customer belongs to
   */
  siteId?: number
  /**
   * External customer identifier
   */
  identifier: string
  /**
   * Customer's first name
   */
  firstName: string
  /**
   * Customer's last name
   */
  lastName: string
  /**
   * Country code (ISO 3166-1 alpha-2)
   */
  country: string
  /**
   * State or province
   */
  state?: string
  /**
   * City name
   */
  city: string
  /**
   * Postal/ZIP code
   */
  zipCode: string
  /**
   * Street address
   */
  address: string
  /**
   * Phone number
   */
  phone: string
  /**
   * Email address
   */
  email: string
  /**
   * Whitelist status (0 = not whitelisted, 1 = whitelisted)
   */
  isWhitelisted?: number
  /**
   * ISO 8601 date-time until when the customer is whitelisted
   */
  isWhitelistedUntil?: string
  /**
   * ISO 8601 date-time when the customer was created
   */
  creationDate: string
  /**
   * Unix timestamp of customer creation
   */
  creationTimestamp: number
  /**
   * Customer tags for categorization
   */
  tags?: Tag[]
}

/**
 * Parameters for creating a new customer
 */
export interface CustomerCreateParams {
  /**
   * External customer identifier (required)
   */
  identifier: string
  /**
   * Customer email address (required)
   */
  email: string
  /**
   * Site ID to associate the customer with
   */
  siteId?: number
  /**
   * Customer's first name
   */
  firstName?: string
  /**
   * Customer's last name
   */
  lastName?: string
  /**
   * Country code (ISO 3166-1 alpha-2)
   */
  country?: string
  /**
   * State or province
   */
  state?: string
  /**
   * City name
   */
  city?: string
  /**
   * Postal/ZIP code
   */
  zipCode?: string
  /**
   * Street address
   */
  address?: string
  /**
   * Phone number
   */
  phone?: string
  /**
   * Set to 1 to whitelist the customer
   */
  isWhitelisted?: 0 | 1
  /**
   * ISO 8601 date until when to whitelist the customer
   */
  isWhitelistedUntil?: string
  /**
   * Tags to assign to the customer
   */
  tag?: string[]
}

/**
 * Parameters for updating an existing customer
 * All fields are optional except siteId which cannot be changed
 */
export interface CustomerUpdateParams extends Partial<Omit<CustomerCreateParams, 'siteId'>> {}

/**
 * Parameters for listing and filtering customers
 */
export interface CustomerListParams {
  /**
   * Search ID from a previous search operation
   */
  searchId?: string
  /**
   * Filter by customer identifier
   */
  identifier?: string
  /**
   * Enable partial matching for identifier (1 = partial, 0 = exact)
   */
  identifierMatchPartial?: 0 | 1
  /**
   * Filter by parent resource type
   */
  parentResourceType?: 'partner' | 'merchant' | 'site'
  /**
   * Filter by parent resource IDs
   */
  parentResourceId?: number[]
  /**
   * Filter by email address
   */
  email?: string
  /**
   * Filter by whitelist status
   */
  isWhitelisted?: 0 | 1
  /**
   * Filter by whitelist expiry date (from)
   */
  isWhitelistedUntilFrom?: string
  /**
   * Filter by whitelist expiry date (to)
   */
  isWhitelistedUntilTo?: string
  /**
   * Filter by tag
   */
  tag?: string
  /**
   * Filter by country code
   */
  country?: string
  /**
   * Filter by state
   */
  state?: string
  /**
   * Filter by creation date (from)
   */
  createdAtFrom?: Date
  /**
   * Filter by creation date (to)
   */
  createdAtTo?: Date
  /**
   * Page number for pagination
   */
  page?: number
  /**
   * Number of items per page
   */
  perPage?: number
  /**
   * Reverse sort order (1 = reverse, 0 = normal)
   */
  reverseSorting?: 0 | 1
}

/**
 * Resource for managing customers in XMoney
 *
 * @example
 * ```typescript
 * const xMoney = createXMoney({ apiKey: 'your-api-key' })
 *
 * // Create a customer
 * const { id } = await xMoney.customers.create({
 *   identifier: 'CUST-123',
 *   email: 'john.doe@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * })
 *
 * // List customers with pagination
 * const customers = await xMoney.customers.list({ perPage: 20 })
 * for await (const customer of customers) {
 *   console.log(customer.email)
 * }
 * ```
 */
export class CustomersResource {
  constructor(private client: XMoneyCore) {}

  /**
   * Create a new customer
   * @param params - Customer creation parameters
   * @returns Object containing the new customer ID
   * @throws {XMoneyError} If creation fails
   */
  async create(params: CustomerCreateParams): Promise<{ id: number }> {
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

  /**
   * Retrieve a customer by ID
   * @param id - Customer ID
   * @returns Customer information
   * @throws {XMoneyError} If customer not found
   */
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

  /**
   * Update an existing customer
   * @param id - Customer ID
   * @param params - Fields to update
   * @throws {XMoneyError} If update fails
   */
  async update(id: number, params: CustomerUpdateParams): Promise<void> {
    await this.client.request({
      method: 'PUT',
      path: `/customer/${id}`,
      body: params,
    })
  }

  /**
   * Delete a customer
   * @param id - Customer ID
   * @throws {XMoneyError} If deletion fails
   */
  async delete(id: number): Promise<void> {
    await this.client.request({
      method: 'DELETE',
      path: `/customer/${id}`,
    })
  }

  /**
   * List customers with optional filtering and pagination
   * @param params - List parameters
   * @returns Paginated list of customers
   *
   * @example
   * ```typescript
   * // List all customers
   * const customers = await xMoney.customers.list()
   *
   * // Filter by email and iterate through pages
   * const filtered = await xMoney.customers.list({
   *   email: 'john.doe@example.com',
   *   perPage: 50
   * })
   * for await (const customer of filtered) {
   *   console.log(customer)
   * }
   * ```
   */
  async list(params?: CustomerListParams): Promise<PaginatedList<Customer>> {
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

  /**
   * Search for customers with advanced filtering
   *
   * Creates a search query that can be used to retrieve results
   * @param params - Search parameters (excluding searchId and page)
   * @returns SearchResult that can be used to fetch results
   * @throws {XMoneyError} If search fails
   *
   * @example
   * ```typescript
   * const search = await xMoney.customers.search({
   *   country: 'US',
   *   createdAtFrom: new Date('2024-01-01')
   * })
   * const results = await search.getResults()
   * ```
   */
  async search(params: Omit<CustomerListParams, 'searchId' | 'page'>): Promise<SearchResult<Customer>> {
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

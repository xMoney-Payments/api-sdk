import type { ApiResponse, Pagination } from '../types'

/**
 * Paginated list with automatic pagination support
 *
 * Implements both synchronous iteration (current page only) and
 * asynchronous iteration (all pages). Memory-efficient for large datasets.
 *
 * @template T - Type of items in the list
 *
 * @example
 * ```typescript
 * // Get a paginated list
 * const customers = await xMoney.customers.list({ perPage: 20 })
 *
 * // Iterate current page only
 * for (const customer of customers) {
 *   console.log(customer.email)
 * }
 *
 * // Iterate all pages automatically
 * for await (const customer of customers) {
 *   console.log(customer.email)
 * }
 *
 * // Get all items as array (loads all pages)
 * const allCustomers = await customers.toArrayAll()
 * ```
 */
export class PaginatedList<T> implements AsyncIterable<T> {
  constructor(
    public readonly data: T[],
    public readonly pagination?: Pagination,
    private searchParams?: Record<string, any>,
    private fetchNextPage?: (page: number) => Promise<ApiResponse<T[]>>,
  ) {}

  /**
   * Check if there are more pages available
   */
  get hasMore(): boolean {
    if (!this.pagination)
      return false
    return this.pagination.currentPageNumber < this.pagination.pageCount
  }

  /**
   * Total number of items across all pages
   */
  get totalCount(): number {
    return this.pagination?.totalItemCount ?? this.data.length
  }

  /**
   * Current page number (1-indexed)
   */
  get currentPage(): number {
    return this.pagination?.currentPageNumber ?? 1
  }

  /**
   * Total number of pages
   */
  get totalPages(): number {
    return this.pagination?.pageCount ?? 1
  }

  /**
   * Number of items per page
   */
  get perPage(): number {
    return this.pagination?.itemCountPerPage ?? this.data.length
  }

  /**
   * Synchronous iterator for current page only
   * @returns Iterator for items on the current page
   */
  [Symbol.iterator](): Iterator<T> {
    return this.data[Symbol.iterator]()
  }

  /**
   * Asynchronous iterator that automatically fetches all pages
   * @yields Items from all pages in sequence
   */
  async* [Symbol.asyncIterator](): AsyncIterator<T> {
    // First yield all items from current page
    for (const item of this.data) {
      yield item
    }

    // If there are more pages and we have a way to fetch them
    if (this.hasMore && this.fetchNextPage) {
      let nextPage = this.currentPage + 1

      while (nextPage <= this.totalPages) {
        const response = await this.fetchNextPage(nextPage)

        if (response.data) {
          for (const item of response.data) {
            yield item
          }
        }

        // Check if we should continue
        if (!response.pagination || nextPage >= response.pagination.pageCount) {
          break
        }

        nextPage++
      }
    }
  }

  /**
   * Get current page items as array
   * @returns Array of items from current page only
   */
  toArray(): T[] {
    return [...this.data]
  }

  /**
   * Fetch all pages and return as a single array
   *
   * Warning: This loads all pages into memory at once.
   * Use async iteration for large datasets.
   *
   * @returns Array containing all items from all pages
   */
  async toArrayAll(): Promise<T[]> {
    const allItems: T[] = []

    for await (const item of this) {
      allItems.push(item)
    }

    return allItems
  }

  /**
   * Get a specific page by number
   * @param pageNumber - Page number to fetch (1-indexed)
   * @returns PaginatedList for the requested page, or null if invalid
   */
  async getPage(pageNumber: number): Promise<PaginatedList<T> | null> {
    if (!this.fetchNextPage || pageNumber < 1) {
      return null
    }

    if (pageNumber === this.currentPage) {
      return this
    }

    const response = await this.fetchNextPage(pageNumber)

    if (!response.data) {
      return null
    }

    return new PaginatedList(
      response.data,
      response.pagination,
      response.searchParams,
      this.fetchNextPage,
    )
  }

  /**
   * Take first N items across all pages
   * @param count - Number of items to take
   * @returns Array of up to count items
   */
  async take(count: number): Promise<T[]> {
    const items: T[] = []

    for await (const item of this) {
      items.push(item)
      if (items.length >= count)
        break
    }

    return items
  }

  /**
   * Find first item matching predicate across all pages
   * @param predicate - Function to test each item
   * @returns First matching item or undefined
   */
  async find(predicate: (item: T) => boolean): Promise<T | undefined> {
    for await (const item of this) {
      if (predicate(item))
        return item
    }
    return undefined
  }

  /**
   * Filter items across all pages
   * @param predicate - Function to test each item
   * @returns Array of items that match the predicate
   */
  async filter(predicate: (item: T) => boolean): Promise<T[]> {
    const items: T[] = []

    for await (const item of this) {
      if (predicate(item))
        items.push(item)
    }

    return items
  }

  /**
   * Map items across all pages to a new type
   * @template U - Type to map to
   * @param mapper - Function to transform each item
   * @returns Array of mapped items
   */
  async map<U>(mapper: (item: T) => U): Promise<U[]> {
    const items: U[] = []

    for await (const item of this) {
      items.push(mapper(item))
    }

    return items
  }
}

/**
 * Search result container for deferred search execution
 *
 * Holds a search ID that can be used to fetch results later
 *
 * @template T - Type of items in search results
 *
 * @example
 * ```typescript
 * const search = await xMoney.customers.search({
 *   country: 'US',
 *   createdAtFrom: new Date('2024-01-01')
 * })
 *
 * // Fetch results when needed
 * const results = await search.fetch()
 * ```
 */
export class SearchResult<T> {
  constructor(
    public readonly searchId: string,
    private fetchFn: () => Promise<PaginatedList<T>>,
  ) {}

  /**
   * Fetch search results
   * @returns Paginated list of search results
   */
  async fetch(): Promise<PaginatedList<T>> {
    return this.fetchFn()
  }
}

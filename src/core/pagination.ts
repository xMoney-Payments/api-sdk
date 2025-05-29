import type { ApiResponse, Pagination } from '../types'

export class PaginatedList<T> implements AsyncIterable<T> {
  constructor(
    public readonly data: T[],
    public readonly pagination?: Pagination,
    private searchParams?: Record<string, any>,
    private fetchNextPage?: (page: number) => Promise<ApiResponse<T[]>>,
  ) {}

  get hasMore(): boolean {
    if (!this.pagination)
      return false
    return this.pagination.currentPageNumber < this.pagination.pageCount
  }

  get totalCount(): number {
    return this.pagination?.totalItemCount ?? this.data.length
  }

  get currentPage(): number {
    return this.pagination?.currentPageNumber ?? 1
  }

  get totalPages(): number {
    return this.pagination?.pageCount ?? 1
  }

  get perPage(): number {
    return this.pagination?.itemCountPerPage ?? this.data.length
  }

  // Iterate through current page only
  [Symbol.iterator](): Iterator<T> {
    return this.data[Symbol.iterator]()
  }

  // Iterate through all pages (async)
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

  // Utility method for converting current page to array
  toArray(): T[] {
    return [...this.data]
  }

  // Fetch all pages and return as array
  async toArrayAll(): Promise<T[]> {
    const allItems: T[] = []

    for await (const item of this) {
      allItems.push(item)
    }

    return allItems
  }

  // Get a specific page
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

  // Utility methods for common operations
  async take(count: number): Promise<T[]> {
    const items: T[] = []

    for await (const item of this) {
      items.push(item)
      if (items.length >= count)
        break
    }

    return items
  }

  async find(predicate: (item: T) => boolean): Promise<T | undefined> {
    for await (const item of this) {
      if (predicate(item))
        return item
    }
    return undefined
  }

  async filter(predicate: (item: T) => boolean): Promise<T[]> {
    const items: T[] = []

    for await (const item of this) {
      if (predicate(item))
        items.push(item)
    }

    return items
  }

  async map<U>(mapper: (item: T) => U): Promise<U[]> {
    const items: U[] = []

    for await (const item of this) {
      items.push(mapper(item))
    }

    return items
  }
}

export class SearchResult<T> {
  constructor(
    public readonly searchId: string,
    private fetchFn: () => Promise<PaginatedList<T>>,
  ) {}

  async fetch(): Promise<PaginatedList<T>> {
    return this.fetchFn()
  }
}

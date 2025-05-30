import type { Pagination } from '../../src/types'
import { describe, expect, it, vi } from 'vitest'
import { PaginatedList, SearchResult } from '../../src/core'

describe('paginatedList', () => {
  const mockData = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ]

  const mockPagination: Pagination = {
    currentPageNumber: 1,
    totalItemCount: 9,
    itemCountPerPage: 3,
    currentItemCount: 3,
    pageCount: 3,
  }

  describe('constructor and basic properties', () => {
    it('should create paginated list with data only', () => {
      const list = new PaginatedList(mockData)

      expect(list.data).toEqual(mockData)
      expect(list.pagination).toBeUndefined()
      expect(list.hasMore).toBe(false)
      expect(list.totalCount).toBe(3)
      expect(list.currentPage).toBe(1)
      expect(list.totalPages).toBe(1)
      expect(list.perPage).toBe(3)
    })

    it('should create paginated list with pagination info', () => {
      const list = new PaginatedList(mockData, mockPagination)

      expect(list.data).toEqual(mockData)
      expect(list.pagination).toEqual(mockPagination)
      expect(list.hasMore).toBe(true)
      expect(list.totalCount).toBe(9)
      expect(list.currentPage).toBe(1)
      expect(list.totalPages).toBe(3)
      expect(list.perPage).toBe(3)
    })

    it('should handle last page correctly', () => {
      const lastPagePagination = { ...mockPagination, currentPageNumber: 3 }
      const list = new PaginatedList(mockData, lastPagePagination)

      expect(list.hasMore).toBe(false)
    })
  })

  describe('iterator', () => {
    it('should iterate through current page data', () => {
      const list = new PaginatedList(mockData, mockPagination)
      const items = []

      for (const item of list) {
        items.push(item)
      }

      expect(items).toEqual(mockData)
    })

    it('should support array spread operator', () => {
      const list = new PaginatedList(mockData, mockPagination)
      const items = [...list]

      expect(items).toEqual(mockData)
    })
  })

  describe('async iterator', () => {
    it('should iterate through current page only when no fetch function', async () => {
      const list = new PaginatedList(mockData, mockPagination)
      const items = []

      for await (const item of list) {
        items.push(item)
      }

      expect(items).toEqual(mockData)
    })

    it('should iterate through all pages when fetch function provided', async () => {
      const page2Data = [
        { id: 4, name: 'Item 4' },
        { id: 5, name: 'Item 5' },
        { id: 6, name: 'Item 6' },
      ]
      const page3Data = [
        { id: 7, name: 'Item 7' },
        { id: 8, name: 'Item 8' },
        { id: 9, name: 'Item 9' },
      ]

      const fetchNextPage = vi.fn().mockImplementation((page: number) => {
        if (page === 2) {
          return Promise.resolve({
            data: page2Data,
            pagination: { ...mockPagination, currentPageNumber: 2 },
          })
        }
        if (page === 3) {
          return Promise.resolve({
            data: page3Data,
            pagination: { ...mockPagination, currentPageNumber: 3 },
          })
        }
        return Promise.resolve({ data: [] })
      })

      const list = new PaginatedList(mockData, mockPagination, {}, fetchNextPage)
      const items = []

      for await (const item of list) {
        items.push(item)
      }

      expect(items).toEqual([...mockData, ...page2Data, ...page3Data])
      expect(fetchNextPage).toHaveBeenCalledTimes(2)
      expect(fetchNextPage).toHaveBeenCalledWith(2)
      expect(fetchNextPage).toHaveBeenCalledWith(3)
    })

    it('should handle empty response from fetchNextPage', async () => {
      const fetchNextPage = vi.fn().mockResolvedValue({ data: null })
      const list = new PaginatedList(mockData, mockPagination, {}, fetchNextPage)
      const items = []

      for await (const item of list) {
        items.push(item)
      }

      expect(items).toEqual(mockData)
    })
  })

  describe('utility methods', () => {
    it('toArray should return current page data', () => {
      const list = new PaginatedList(mockData, mockPagination)
      expect(list.toArray()).toEqual(mockData)
    })

    it('toArrayAll should fetch all pages', async () => {
      const allData = [
        ...mockData,
        { id: 4, name: 'Item 4' },
        { id: 5, name: 'Item 5' },
      ]

      const fetchNextPage = vi.fn().mockResolvedValue({
        data: [{ id: 4, name: 'Item 4' }, { id: 5, name: 'Item 5' }],
        pagination: { ...mockPagination, currentPageNumber: 2, pageCount: 2 },
      })

      const list = new PaginatedList(mockData, mockPagination, {}, fetchNextPage)
      const result = await list.toArrayAll()

      expect(result).toEqual(allData)
    })

    it('getPage should return specific page', async () => {
      const page2Data = [{ id: 4, name: 'Item 4' }]
      const fetchNextPage = vi.fn().mockResolvedValue({
        data: page2Data,
        pagination: { ...mockPagination, currentPageNumber: 2 },
      })

      const list = new PaginatedList(mockData, mockPagination, {}, fetchNextPage)
      const page2 = await list.getPage(2)

      expect(page2).not.toBeNull()
      expect(page2!.data).toEqual(page2Data)
      expect(page2!.currentPage).toBe(2)
    })

    it('getPage should return current page when requested', async () => {
      const fetchNextPage = vi.fn()
      const list = new PaginatedList(mockData, mockPagination, {}, fetchNextPage)
      const currentPage = await list.getPage(1)

      expect(currentPage).toBe(list)
      expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('getPage should return null for invalid page', async () => {
      const list = new PaginatedList(mockData, mockPagination)
      const result = await list.getPage(0)

      expect(result).toBeNull()
    })

    it('getPage should return null when no fetch function', async () => {
      const list = new PaginatedList(mockData, mockPagination)
      const result = await list.getPage(2)

      expect(result).toBeNull()
    })

    it('take should return limited items', async () => {
      const allData = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }))
      const fetchNextPage = vi.fn().mockResolvedValue({
        data: allData.slice(3),
        pagination: { ...mockPagination, currentPageNumber: 2 },
      })

      const list = new PaginatedList(allData.slice(0, 3), mockPagination, {}, fetchNextPage)
      const result = await list.take(5)

      expect(result).toHaveLength(5)
      expect(result).toEqual(allData.slice(0, 5))
    })

    it('find should return first matching item', async () => {
      const fetchNextPage = vi.fn().mockResolvedValue({
        data: [{ id: 4, name: 'Item 4' }, { id: 5, name: 'Target' }],
        pagination: { ...mockPagination, currentPageNumber: 2 },
      })

      const list = new PaginatedList(mockData, mockPagination, {}, fetchNextPage)
      const result = await list.find(item => item.name === 'Target')

      expect(result).toEqual({ id: 5, name: 'Target' })
    })

    it('find should return undefined when no match', async () => {
      const list = new PaginatedList(mockData)
      const result = await list.find(item => item.name === 'NonExistent')

      expect(result).toBeUndefined()
    })

    it('filter should return matching items from all pages', async () => {
      const page2Data = [
        { id: 4, name: 'Item 4', active: true },
        { id: 5, name: 'Item 5', active: false },
      ]

      const fetchNextPage = vi.fn().mockResolvedValue({
        data: page2Data,
        pagination: { ...mockPagination, currentPageNumber: 2, pageCount: 2 },
      })

      const dataWithActive = mockData.map((item, i) => ({ ...item, active: i % 2 === 0 }))
      const list = new PaginatedList(dataWithActive, mockPagination, {}, fetchNextPage)
      const result = await list.filter(item => item.active)

      expect(result).toEqual([
        { id: 1, name: 'Item 1', active: true },
        { id: 3, name: 'Item 3', active: true },
        { id: 4, name: 'Item 4', active: true },
      ])
    })

    it('map should transform all items', async () => {
      const fetchNextPage = vi.fn().mockResolvedValue({
        data: [{ id: 4, name: 'Item 4' }],
        pagination: { ...mockPagination, currentPageNumber: 2, pageCount: 2 },
      })

      const list = new PaginatedList(mockData, mockPagination, {}, fetchNextPage)
      const result = await list.map(item => item.id)

      expect(result).toEqual([1, 2, 3, 4])
    })
  })
})

describe('searchResult', () => {
  it('should store search ID and fetch function', () => {
    const fetchFn = vi.fn()
    const result = new SearchResult('search-123', fetchFn)

    expect(result.searchId).toBe('search-123')
  })

  it('should call fetch function when fetch is called', async () => {
    const mockList = new PaginatedList([{ id: 1 }])
    const fetchFn = vi.fn().mockResolvedValue(mockList)
    const result = new SearchResult('search-123', fetchFn)

    const list = await result.fetch()

    expect(fetchFn).toHaveBeenCalledOnce()
    expect(list).toBe(mockList)
  })
})

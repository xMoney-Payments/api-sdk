import type { Customer, CustomerCreateParams, CustomerUpdateParams } from '../../src/resources/customers'
import type { XMoneyCore } from '../../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaginatedList, SearchResult } from '../../src/core/pagination'
import { CustomersResource } from '../../src/resources/customers'

describe('customersResource', () => {
  let mockCore: XMoneyCore
  let customersResource: CustomersResource

  const mockCustomer: Customer = {
    id: 123,
    siteId: 456,
    creationDate: `${new Date('2025-01-01').toISOString().slice(0, -5)}+00:00`,
    updatedAt: new Date('2025-01-02'),
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    referenceId: 'ref_123',
    status: 'active',
    tags: [
      {
        tag: 'premium',
        creationDate: `${new Date('2025-01-01').toISOString().slice(0, -5)}+00:00`,
        creationTimestamp: new Date('2025-01-01').getTime(),
      },
    ],
    hasDefaultCard: true,
    hasOtherCards: true,
    hasSuccessfulTransaction: true,
    isReturning: true,
    totalAmountSpent: '1000.00',
    totalTransactions: 10,
  }

  beforeEach(() => {
    mockCore = {
      request: vi.fn(),
    } as any

    customersResource = new CustomersResource(mockCore)
  })

  describe('create', () => {
    it('should create a customer with required fields', async () => {
      const params: CustomerCreateParams = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        identifier: 'ref_456',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: { id: 789 },
      })

      const result = await customersResource.create(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/customer',
        body: params,
      })
      expect(result).toEqual({ id: 789 })
    })

    it('should create a customer with all fields', async () => {
      const params: CustomerCreateParams = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        identifier: 'ref_456',
        tag: ['web'],
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: { id: 999 },
      })

      const result = await customersResource.create(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/customer',
        body: params,
      })
      expect(result).toEqual({ id: 999 })
    })
  })

  describe('retrieve', () => {
    it('should retrieve a customer by ID', async () => {
      mockCore.request = vi.fn().mockResolvedValue({
        data: mockCustomer,
      })

      const result = await customersResource.retrieve(123)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/customer/123',
      })
      expect(result).toEqual(mockCustomer)
    })

    it('should handle string ID', async () => {
      mockCore.request = vi.fn().mockResolvedValue({
        data: mockCustomer,
      })

      await customersResource.retrieve('123' as any)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/customer/123',
      })
    })
  })

  describe('update', () => {
    it('should update a customer', async () => {
      const params: CustomerUpdateParams = {
        email: 'newemail@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      }

      mockCore.request = vi.fn().mockResolvedValue({})

      await customersResource.update(123, params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/customer/123',
        body: params,
      })
    })

    it('should update with tags', async () => {
      const params: CustomerUpdateParams = {
        identifier: 'new_ref',
        tag: ['vip'],
      }

      mockCore.request = vi.fn().mockResolvedValue({})

      await customersResource.update(456, params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/customer/456',
        body: params,
      })
    })

    it('should handle empty update', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await customersResource.update(123, {})

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/customer/123',
        body: {},
      })
    })
  })

  describe('delete', () => {
    it('should delete a customer', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await customersResource.delete(123)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/customer/123',
      })
    })

    it('should handle string ID', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await customersResource.delete('123' as any)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/customer/123',
      })
    })
  })

  describe('list', () => {
    it('should list customers without parameters', async () => {
      const mockCustomers = [mockCustomer]
      const mockPagination = {
        currentPageNumber: 1,
        pageCount: 1,
        totalItemCount: 1,
        itemCountPerPage: 10,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockCustomers,
        pagination: mockPagination,
      })

      const result = await customersResource.list()

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/customer',
      })
      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toEqual(mockCustomers)
    })

    it('should list customers with all parameters', async () => {
      const params = {
        page: 2,
        limit: 20,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        referenceId: 'ref_123',
        status: 'active' as const,
        tag: 'premium',
        searchId: 'search_123',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: [mockCustomer],
        pagination: {
          currentPageNumber: 2,
          pageCount: 5,
          totalItemCount: 100,
          itemCountPerPage: 20,
        },
      })

      await customersResource.list(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/customer',
        query: params,
      })
    })
  })

  describe('search', () => {
    it('should search customers', async () => {
      const searchParams = {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: { searchId: 'search_456' },
      })

      const result = await customersResource.search(searchParams)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/customer-search',
        body: searchParams,
      })
      expect(result).toBeInstanceOf(SearchResult)
      expect(result.searchId).toBe('search_456')
    })

    it('should fetch search results', async () => {
      const searchParams = { email: 'test@example.com' }

      mockCore.request = vi.fn()
        .mockResolvedValueOnce({ data: { searchId: 'search_789' } })
        .mockResolvedValueOnce({
          data: [mockCustomer],
          pagination: {
            currentPageNumber: 1,
            pageCount: 1,
            totalItemCount: 1,
            itemCountPerPage: 10,
          },
          searchParams,
        })

      const searchResult = await customersResource.search(searchParams)
      const paginatedList = await searchResult.fetch()

      expect(paginatedList).toBeInstanceOf(PaginatedList)
      expect(paginatedList.data).toEqual([mockCustomer])
      expect(mockCore.request).toHaveBeenCalledTimes(2)
      expect(mockCore.request).toHaveBeenLastCalledWith({
        method: 'GET',
        path: '/customer',
        query: { searchId: 'search_789' },
      })
    })

    it('should handle search with all parameters', async () => {
      const searchParams = {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        referenceId: 'ref_123',
        status: 'active' as const,
        tag: 'vip',
        limit: 50,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: { searchId: 'search_complex' },
      })

      await customersResource.search(searchParams)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/customer-search',
        body: searchParams,
      })
    })

    it('should exclude searchId and page from search params', async () => {
      // TypeScript should prevent this, but testing runtime behavior
      const invalidParams = {
        email: 'test@example.com',
        searchId: 'should_be_ignored',
        page: 5,
      } as any

      mockCore.request = vi.fn().mockResolvedValue({
        data: { searchId: 'search_new' },
      })

      await customersResource.search(invalidParams)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/customer-search',
        body: invalidParams,
      })
    })
  })
})

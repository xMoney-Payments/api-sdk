import type { Transaction, TransactionStatus, TransactionSummary } from '../../src/resources/transactions'
import type { XMoneyCore } from '../../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaginatedList, SearchResult } from '../../src/core/pagination'
import { TransactionsResource } from '../../src/resources/transactions'

describe('transactionsResource', () => {
  let mockCore: XMoneyCore
  let transactionsResource: TransactionsResource

  const mockTransaction: Transaction = {
    id: 1001,
    organisationId: 456,
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:01:00Z'),
    orderId: 12345,
    type: 'preauth',
    amount: 10000,
    capturedAmount: 10000,
    refundedAmount: 0,
    currency: 'USD',
    status: 'successful',
    gateway: 'stripe',
    referenceId: 'trans_ref_1001',
    responseCode: '00',
    responseMessage: 'Approved',
    avsResponseCode: 'Y',
    cvvResponseCode: 'M',
    rrn: 'RRN123456',
    stan: 'STAN789',
    card: {
      id: 111,
      customerId: 789,
      cardStatus: 'active',
      verified: true,
      cvvVerified: true,
      issueDate: new Date('2025-01-01'),
      expiryDate: new Date('2025-12-31'),
      cardholderName: 'John Doe',
      last4: '4242',
      type: 'visa',
      tags: [],
      fingerprint: 'fp_card_111',
      walletType: null,
      additionalData: {},
    },
    additionalData: {
      processorTransactionId: 'proc_123',
    },
  }

  const mockTransactionSummary: TransactionSummary = {
    id: 1001,
    organisationId: 456,
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:01:00Z'),
    orderId: 12345,
    type: 'preauth',
    amount: 10000,
    capturedAmount: 10000,
    refundedAmount: 0,
    currency: 'USD',
    status: 'successful',
    gateway: 'stripe',
    referenceId: 'trans_ref_1001',
    responseCode: '00',
    responseMessage: 'Approved',
    cardId: 111,
    customerId: 789,
  }

  beforeEach(() => {
    mockCore = {
      request: vi.fn(),
    } as any

    transactionsResource = new TransactionsResource(mockCore)
  })

  describe('retrieve', () => {
    it('should retrieve a transaction by ID', async () => {
      mockCore.request = vi.fn().mockResolvedValue({
        data: mockTransaction,
      })

      const result = await transactionsResource.retrieve(1001)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/transaction/1001',
      })
      expect(result).toEqual(mockTransaction)
    })

    it('should handle string ID', async () => {
      mockCore.request = vi.fn().mockResolvedValue({
        data: mockTransaction,
      })

      await transactionsResource.retrieve('1001' as any)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/transaction/1001',
      })
    })
  })

  describe('capture', () => {
    it('should capture a transaction with full amount', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await transactionsResource.capture(1001, 10000)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/transaction/1001',
        body: { amount: 10000 },
      })
    })

    it('should capture a transaction with partial amount', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await transactionsResource.capture(1001, 5000)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/transaction/1001',
        body: { amount: 5000 },
      })
    })

    it('should handle string ID', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await transactionsResource.capture('1001' as any, 7500)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/transaction/1001',
        body: { amount: 7500 },
      })
    })
  })

  describe('refund', () => {
    it('should refund a transaction without parameters (full refund)', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await transactionsResource.refund(1001)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/transaction/1001',
      })
    })

    it('should refund with partial amount', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await transactionsResource.refund(1001, { amount: 3000 })

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/transaction/1001',
        body: { amount: 3000 },
      })
    })

    it('should refund with reason', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await transactionsResource.refund(1001, {
        amount: 5000,
        reason: 'fraud-confirm',
      })

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/transaction/1001',
        body: {
          amount: 5000,
          reason: 'fraud-confirm',
        },
      })
    })

    it('should handle all refund reasons', async () => {
      const reasons = ['customer-demand', 'duplicated-transaction', 'fraud-confirm', 'highly-suspicious', 'test-transaction', 'card-expired'] as const

      for (const reason of reasons) {
        mockCore.request = vi.fn().mockResolvedValue({})

        await transactionsResource.refund(1001, { reason })

        expect(mockCore.request).toHaveBeenCalledWith({
          method: 'DELETE',
          path: '/transaction/1001',
          body: { reason },
        })
      }
    })
  })

  describe('list', () => {
    it('should list transactions without parameters', async () => {
      const mockTransactions = [mockTransactionSummary]
      const mockPagination = {
        currentPageNumber: 1,
        pageCount: 1,
        totalItemCount: 1,
        itemCountPerPage: 10,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockTransactions,
        pagination: mockPagination,
      })

      const result = await transactionsResource.list()

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/transaction',
      })
      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toEqual(mockTransactions)
    })

    it('should list transactions with all parameters', async () => {
      const params = {
        page: 2,
        limit: 25,
        customerId: 789,
        cardId: 111,
        orderId: 12345,
        referenceId: 'trans_ref',
        status: 'successful' as const,
        type: 'preauth' as const,
        gateway: 'stripe',
        responseCode: '00',
        tag: 'important',
        searchId: 'search_trans_123',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: [mockTransactionSummary],
        pagination: {
          currentPageNumber: 2,
          pageCount: 10,
          totalItemCount: 250,
          itemCountPerPage: 25,
        },
      })

      await transactionsResource.list(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/transaction',
        query: params,
      })
    })

    it('should handle empty results', async () => {
      mockCore.request = vi.fn().mockResolvedValue({
        data: [],
        pagination: {
          currentPageNumber: 1,
          pageCount: 0,
          totalItemCount: 0,
          itemCountPerPage: 10,
        },
      })

      const result = await transactionsResource.list({ transactionStatus: ['complete-failed'] })

      expect(result.data).toEqual([])
      expect(result.totalCount).toBe(0)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('search', () => {
    it('should search transactions', async () => {
      const searchParams = {
        customerId: 789,
        transactionStatus: ['complete-ok'],
        transactionType: 'credit',
        perPage: 50,
      } as Parameters<typeof transactionsResource.search>[0]

      mockCore.request = vi.fn().mockResolvedValue({
        searchId: 'search_trans_456',
      })

      const result = await transactionsResource.search(searchParams)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/transaction-search',
        body: searchParams,
      })
      expect(result).toBeInstanceOf(SearchResult)
      expect(result.searchId).toBe('search_trans_456')
    })

    it('should fetch search results', async () => {
      const searchParams = {
        walletProvider: 'paypal',
        transactionStatus: ['complete-failed'] as TransactionStatus[],
      }

      mockCore.request = vi.fn()
        .mockResolvedValueOnce({ searchId: 'search_trans_789' })
        .mockResolvedValueOnce({
          data: [mockTransactionSummary],
          pagination: {
            currentPageNumber: 1,
            pageCount: 1,
            totalItemCount: 1,
            itemCountPerPage: 10,
          },
          searchParams,
        })

      const searchResult = await transactionsResource.search(searchParams)
      const paginatedList = await searchResult.fetch()

      expect(paginatedList).toBeInstanceOf(PaginatedList)
      expect(paginatedList.data).toEqual([mockTransactionSummary])
      expect(mockCore.request).toHaveBeenCalledTimes(2)
      expect(mockCore.request).toHaveBeenLastCalledWith({
        method: 'GET',
        path: '/transaction',
        query: { searchId: 'search_trans_789' },
      })
    })

    it('should handle search with date filters', async () => {
      const searchParams = {
        createdAtFrom: new Date('2025-01-01'),
        createdAtTo: new Date('2025-12-31'),
        amountFrom: 1000,
        amountTo: 50000,
      } as Parameters<typeof transactionsResource.search>[0]

      mockCore.request = vi.fn().mockResolvedValue({
        searchId: 'search_date_amount',
      })

      await transactionsResource.search(searchParams)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/transaction-search',
        body: searchParams,
      })
    })

    it('should handle all transaction types in search', async () => {
      const types = ['preauth', 'capture', 'refund', 'void'] as const

      for (const type of types) {
        mockCore.request = vi.fn().mockResolvedValue({
          searchId: `search_${type}`,
        })

        await transactionsResource.search({ type })

        expect(mockCore.request).toHaveBeenCalledWith({
          method: 'POST',
          path: '/transaction-search',
          body: { type },
        })
      }
    })

    it('should handle all transaction statuses in search', async () => {
      const statuses = ['pending', 'successful', 'failed', 'cancelled'] as const

      for (const status of statuses) {
        mockCore.request = vi.fn().mockResolvedValue({
          searchId: `search_${status}`,
        })

        await transactionsResource.search({ status })

        expect(mockCore.request).toHaveBeenCalledWith({
          method: 'POST',
          path: '/transaction-search',
          body: { status },
        })
      }
    })
  })
})

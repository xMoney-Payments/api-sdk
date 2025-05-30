import type { Card } from '../../src/resources/cards'
import type { XMoneyCore } from '../../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaginatedList } from '../../src/core/pagination'
import { CardsResource } from '../../src/resources/cards'

describe('cardsResource', () => {
  let mockCore: XMoneyCore
  let cardsResource: CardsResource

  const mockCard: Card = {
    id: 123,
    customerId: 456,
    cardStatus: 'active',
    verified: true,
    cvvVerified: true,
    issueDate: `${new Date('2025-01-01').toISOString().slice(0, -5)}+00:00}`,
    expiryDate: `${new Date('2025-12-31').toISOString().slice(0, -5)}+00:00`,
    cardholderName: 'John Doe',
    last4: '1234',
    type: 'visa',
    bin: {
      bin: '424242',
      brand: 'Visa',
      issuer: 'Test Bank',
      issuerCountry: 'US',
      issuerCountryAlpha3: 'USA',
      issuerCountryNumeric: '840',
      type: 'credit',
      subBrand: null,
      bankUrl: 'https://testbank.com',
      bankPhone: '+1234567890',
    },
    tags: [{ key: 'type', value: 'premium' }],
    fingerprint: 'card_fingerprint_123',
    walletType: null,
    additionalData: {},
  }

  beforeEach(() => {
    mockCore = {
      request: vi.fn(),
    } as any

    cardsResource = new CardsResource(mockCore)
  })

  describe('retrieve', () => {
    it('should retrieve a card by ID and customer ID', async () => {
      mockCore.request = vi.fn().mockResolvedValue({
        data: mockCard,
      })

      const result = await cardsResource.retrieve(123, 456)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/card/123',
        query: { customerId: 456 },
      })
      expect(result).toEqual(mockCard)
    })

    it('should handle string IDs', async () => {
      mockCore.request = vi.fn().mockResolvedValue({
        data: mockCard,
      })

      await cardsResource.retrieve('123' as any, '456' as any)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/card/123',
        query: { customerId: '456' },
      })
    })
  })

  describe('delete', () => {
    it('should delete a card by ID', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await cardsResource.delete(123)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/card/123',
      })
    })

    it('should handle string ID', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await cardsResource.delete('123' as any)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/card/123',
      })
    })
  })

  describe('list', () => {
    it('should list cards without parameters', async () => {
      const mockCards = [mockCard]
      const mockPagination = {
        currentPageNumber: 1,
        pageCount: 1,
        totalItemCount: 1,
        itemCountPerPage: 10,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockCards,
        pagination: mockPagination,
      })

      const result = await cardsResource.list()

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/card',
      })
      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toEqual(mockCards)
      expect(result.pagination).toEqual(mockPagination)
    })

    it('should list cards with all parameters', async () => {
      const params = {
        page: 2,
        limit: 20,
        customerId: 456,
        status: 'active' as const,
        cardholderName: 'John',
        last4: '1234',
        fingerprint: 'fp_123',
        issuer: 'Test Bank',
        verified: true,
        cvvVerified: true,
        walletType: 'apple_pay' as const,
        type: 'visa' as const,
        bin: '424242',
        issuerCountry: 'US',
        issuerCountryAlpha3: 'USA',
        issuerCountryNumeric: '840',
        tag: 'premium',
        searchId: 'search_123',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: [mockCard],
        pagination: {
          currentPageNumber: 2,
          pageCount: 5,
          totalItemCount: 100,
          itemCountPerPage: 20,
        },
      })

      await cardsResource.list(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/card',
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

      const result = await cardsResource.list({ customerId: 999 })

      expect(result.data).toEqual([])
      expect(result.totalCount).toBe(0)
      expect(result.hasMore).toBe(false)
    })

    it('should support pagination with fetchNextPage', async () => {
      const firstPageData = [{ ...mockCard, id: 1 }]
      const secondPageData = [{ ...mockCard, id: 2 }]

      let callCount = 0
      mockCore.request = vi.fn().mockImplementation(async (options) => {
        callCount++
        if (callCount === 1 || options.query?.page === 1) {
          return {
            data: firstPageData,
            pagination: {
              currentPageNumber: 1,
              pageCount: 2,
              totalItemCount: 2,
              itemCountPerPage: 1,
            },
          }
        }
        return {
          data: secondPageData,
          pagination: {
            currentPageNumber: 2,
            pageCount: 2,
            totalItemCount: 2,
            itemCountPerPage: 1,
          },
        }
      })

      const result = await cardsResource.list({ limit: 1 })

      expect(result.hasMore).toBe(true)
      expect(result.data).toEqual(firstPageData)

      // Test async iteration
      const allItems = []
      for await (const item of result) {
        allItems.push(item)
      }

      expect(allItems).toHaveLength(2)
      expect(allItems[0].id).toBe(1)
      expect(allItems[1].id).toBe(2)
    })

    it('should pass through tag parameter', async () => {
      mockCore.request = vi.fn().mockResolvedValue({
        data: [],
        pagination: {
          currentPageNumber: 1,
          pageCount: 0,
          totalItemCount: 0,
          itemCountPerPage: 10,
        },
      })

      await cardsResource.list({ tag: 'vip' })

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/card',
        query: { tag: 'vip' },
      })
    })
  })
})

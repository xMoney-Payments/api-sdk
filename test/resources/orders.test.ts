import type { CreateOrderResponse, Order, OrderCreateParams, OrderListParams, OrderRebillParams, OrderUpdateCardParams } from '../../src/resources'
import type { XMoneyCore } from '../../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaginatedList, SearchResult } from '../../src/core'
import { OrdersResource } from '../../src/resources'

describe('ordersResource', () => {
  let mockCore: XMoneyCore
  let ordersResource: OrdersResource

  const mockOrder: Order = {
    id: 12345,
    siteId: 456,
    customerId: 789,
    externalOrderId: 'ref_12345',
    orderType: 'purchase',
    orderStatus: 'complete-ok',
    amount: 10000,
    currency: 'USD',
    description: 'Test order description',
    invoiceEmail: 'customer@example.com',
    createdAt: `${new Date('2025-01-01').toISOString().slice(0, -5)}+00:00`,
    intervalType: 'month',
    intervalValue: 1,
    retryPayment: 'P1M,P2M',
    nextDueDate: `${new Date('2025-02-01').toISOString().slice(0, -5)}+00:00`,
    transactionMethod: 'card',
    tags: [
      {
        tag: 'web',
        creationDate: `${new Date('2025-01-01').toISOString().slice(0, -5)}+00:00`,
        creationTimestamp: 1735689600,
      },
    ],
  }

  beforeEach(() => {
    mockCore = {
      request: vi.fn(),
    } as any

    ordersResource = new OrdersResource(mockCore)
  })

  describe('create', () => {
    it('should create an order with required fields', async () => {
      const params: OrderCreateParams = {
        customerId: 789,
        ip: '127.0.0.1',
        amount: 5000,
        currency: 'USD',
        orderType: 'purchase',
        externalOrderId: 'ref_new_order',
      }

      const mockResponse: CreateOrderResponse = {
        orderId: 54321,
        transactionId: 2001,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockResponse,
      })

      const result = await ordersResource.create(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/order',
        body: params,
      })
      expect(result).toEqual(mockResponse)
    })

    it('should create an order with all fields', async () => {
      const params: OrderCreateParams = {
        amount: 10000,
        currency: 'EUR',
        externalOrderId: 'ref_full_order',
        orderType: 'recurring',
        customerId: 789,
        invoiceEmail: 'customer@example.com',
        cardHolderName: 'Jane Smith',
        cardId: '111',
        ip: '10.0.0.1',
        saveCard: true,
        externalCustomData: JSON.stringify({ orderId: 'internal_123' }),
      }

      const mockResponse: CreateOrderResponse = {
        orderId: 99999,
        transactionId: 3001,
        cardId: 222,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockResponse,
      })

      const result = await ordersResource.create(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/order',
        body: params,
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('retrieve', () => {
    it('should retrieve an order by numeric ID', async () => {
      mockCore.request = vi.fn().mockResolvedValue({
        data: mockOrder,
      })

      const result = await ordersResource.retrieve(12345)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/order/12345',
      })
      expect(result).toEqual(mockOrder)
    })

    it('should retrieve an order by string orderId', async () => {
      mockCore.request = vi.fn().mockResolvedValue({
        data: mockOrder,
      })

      const result = await ordersResource.retrieve('order_12345')

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/order/order_12345',
      })
      expect(result).toEqual(mockOrder)
    })
  })

  describe('cancel', () => {
    it('should cancel an order without parameters', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await ordersResource.cancel(12345)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/order/12345',
      })
    })

    it('should cancel an order with refund parameters', async () => {
      mockCore.request = vi.fn().mockResolvedValue({})

      await ordersResource.cancel('order_12345', {
        reason: 'fraud-confirm',
        message: 'Suspicious activity detected',
        terminateOrder: 'yes',
      })

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/order/order_12345',
        body: {
          reason: 'fraud-confirm',
          message: 'Suspicious activity detected',
          terminateOrder: 'yes',
        },
      })
    })
  })

  describe('rebill', () => {
    it('should rebill an order', async () => {
      const params: OrderRebillParams = {
        customerId: 789,
        amount: 7500,
        transactionOption: JSON.stringify({
          digitalWallet: {
            walletType: 'googlePay',
            data: 'eyJtZXNzYWdlSWQiOiJBUEEwMV8xMjM0NTY3ODkwIiwiZW5jcnlwdGVkTWVzc2FnZSI6InNvbWVFbmNyeXB0ZWREYXRhIn0=',
          },
          isSoftDecline: 'yes',
          splitPayment: {
            splitSchema: [
              {
                toSite: 1001,
                amount: 150.50,
                description: 'Payment for merchant A',
                tag: ['electronics', 'online-store', 'premium'],
              },
              {
                toSite: 1002,
                amount: 49.99,
                description: 'Payment for merchant B',
                tag: ['books', 'education'],
              },
            ],
          },
        }),
      }

      const mockResponse = {
        id: 67890,
        transactionId: 4001,
        cardId: 333,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockResponse,
      })

      const result = await ordersResource.rebill(12345, params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/order-rebill/12345',
        body: params,
      })
      expect(result).toEqual(mockResponse)
    })

    it('should rebill with minimal parameters', async () => {
      const params: OrderRebillParams = {
        customerId: 789,
        amount: 2000,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: { id: 11111 },
      })

      await ordersResource.rebill('order_12345', params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/order-rebill/order_12345',
        body: params,
      })
    })
  })

  describe('updateCard', () => {
    it('should update card for an order', async () => {
      const params: OrderUpdateCardParams = {
        customerId: '789',
        ip: '10.0.0.1',
        amount: 6000,
        currency: 'USD',
        cardNumber: '4111111111111111',
        cardExpiryDate: '01/99',
        cardCvv: '123',
        transactionDescription: 'Order update card',
        cardHolderName: 'Alice Johnson',
        cardHolderCountry: 'US',
        cardHolderState: 'CA',
        cardType: 'visa',
        cardDescriptor: 'Order Update',
      }

      const mockResponse = {
        id: 88888,
        transactionId: 5001,
        cardId: 444,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockResponse,
      })

      const result = await ordersResource.updateCard(12345, params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/order-update-card/12345',
        body: params,
      })
      expect(result).toEqual(mockResponse)
    })

    it('should update card with minimal parameters', async () => {
      const params: OrderUpdateCardParams = {
        customerId: '789',
        ip: '10.0.0.1',
        amount: 3000,
        currency: 'USD',
        cardNumber: '4111111111111111',
        cardExpiryDate: '01/99',
        cardCvv: '123',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: { id: 99999 },
      })

      await ordersResource.updateCard('order_12345', params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/order-update-card/order_12345',
        body: params,
      })
    })
  })

  describe('list', () => {
    it('should list orders without parameters', async () => {
      const mockOrders = [mockOrder]
      const mockPagination = {
        currentPageNumber: 1,
        pageCount: 1,
        totalItemCount: 1,
        itemCountPerPage: 10,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockOrders,
        pagination: mockPagination,
      })

      const result = await ordersResource.list()

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/order',
      })
      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toEqual(mockOrders)
    })

    it('should list orders with all parameters', async () => {
      const params = {
        page: 3,
        limit: 50,
        customerId: 789,
        cardId: 111,
        referenceId: 'ref_search',
        status: 'complete' as const,
        valid: true,
        cancelled: false,
        type: 'single_payment' as const,
        tag: 'web',
        searchId: 'search_orders_123',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: [mockOrder],
        pagination: {
          currentPageNumber: 3,
          pageCount: 10,
          totalItemCount: 500,
          itemCountPerPage: 50,
        },
      })

      await ordersResource.list(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/order',
        query: params,
      })
    })
  })

  describe('search', () => {
    it('should search orders', async () => {
      const searchParams = {
        customerId: 789,
        status: 'complete' as const,
        type: 'single_payment' as const,
        limit: 25,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: { searchId: 'search_orders_456' },
      })

      const result = await ordersResource.search(searchParams)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/order-search',
        body: searchParams,
      })
      expect(result).toBeInstanceOf(SearchResult)
      expect(result.searchId).toBe('search_orders_456')
    })

    it('should fetch search results', async () => {
      const searchParams = { externalOrderId: 'ref_pattern' }

      mockCore.request = vi.fn()
        .mockResolvedValueOnce({ data: { searchId: 'search_orders_789' } })
        .mockResolvedValueOnce({
          data: [mockOrder],
          pagination: {
            currentPageNumber: 1,
            pageCount: 1,
            totalItemCount: 1,
            itemCountPerPage: 10,
          },
          searchParams,
        })

      const searchResult = await ordersResource.search(searchParams)
      const paginatedList = await searchResult.fetch()

      expect(paginatedList).toBeInstanceOf(PaginatedList)
      expect(paginatedList.data).toEqual([mockOrder])
      expect(mockCore.request).toHaveBeenCalledTimes(2)
      expect(mockCore.request).toHaveBeenLastCalledWith({
        method: 'GET',
        path: '/order',
        query: { searchId: 'search_orders_789' },
      })
    })

    it('should handle search with date filters', async () => {
      const searchParams: OrderListParams = {
        createdAtFrom: new Date('2025-01-01'),
        createdAtTo: new Date('2025-12-31'),
        tag: 'seasonal',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: { searchId: 'search_date_range' },
      })

      await ordersResource.search(searchParams)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/order-search',
        body: searchParams,
      })
    })
  })
})

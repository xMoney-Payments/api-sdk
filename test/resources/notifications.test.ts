import type { Notification } from '../../src/resources'
import type { XMoneyCore } from '../../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaginatedList } from '../../src/core'
import { NotificationsResource } from '../../src/resources'

describe('notificationsResource', () => {
  let mockCore: XMoneyCore
  let notificationsResource: NotificationsResource

  const mockNotification: Notification = {
    id: 5001,
    siteId: 456,
    resourceId: 1001,
    resourceType: 'transaction',
    message: 'transactionCapture',
    creationDate: `${new Date('2025-01-01').toISOString().slice(0, -5)}+00:00`,
    creationTimestamp: new Date('2025-01-01').getTime(),
  }

  beforeEach(() => {
    mockCore = {
      request: vi.fn(),
    } as any

    notificationsResource = new NotificationsResource(mockCore)
  })

  describe('list', () => {
    it('should list notifications without parameters', async () => {
      const mockNotifications = [mockNotification]
      const mockPagination = {
        currentPageNumber: 1,
        pageCount: 1,
        totalItemCount: 1,
        itemCountPerPage: 10,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockNotifications,
        pagination: mockPagination,
      })

      const result = await notificationsResource.list()

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/notification',
      })
      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toEqual(mockNotifications)
      expect(result.pagination).toEqual(mockPagination)
    })

    it('should list notifications with all parameters', async () => {
      const params = {
        page: 2,
        limit: 25,
        type: 'webhook' as const,
        event: 'transaction.successful',
        status: 'successful' as const,
        url: 'https://example.com/webhooks',
        searchId: 'search_notif_123',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: [mockNotification],
        pagination: {
          currentPageNumber: 2,
          pageCount: 5,
          totalItemCount: 125,
          itemCountPerPage: 25,
        },
      })

      await notificationsResource.list(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/notification',
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

      const result = await notificationsResource.list({ message: ['transactionFail'] })

      expect(result.data).toEqual([])
      expect(result.totalCount).toBe(0)
      expect(result.hasMore).toBe(false)
    })

    it('should handle different notification statuses', async () => {
      const statuses = ['orderNew', 'orderChange', 'orderExtend', 'orderRetrying', 'orderInProgress', 'orderCancel', 'transactionNew', 'transactionCapture', 'transactionFail'] as const

      for (const message of statuses) {
        mockCore.request = vi.fn().mockResolvedValue({
          data: [],
          pagination: {
            currentPageNumber: 1,
            pageCount: 0,
            totalItemCount: 0,
            itemCountPerPage: 10,
          },
        })

        await notificationsResource.list({ message: [message] })

        expect(mockCore.request).toHaveBeenCalledWith({
          method: 'GET',
          path: '/notification',
          query: { message: [message] },
        })
      }
    })

    it('should support pagination', async () => {
      const firstPageData = [{ ...mockNotification, id: 1 }]
      const secondPageData = [{ ...mockNotification, id: 2 }]

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

      const result = await notificationsResource.list({ perPage: 1 })

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
  })

  describe('listForOrders', () => {
    it('should list notifications for orders without parameters', async () => {
      const mockNotifications = [mockNotification]
      const mockPagination = {
        currentPageNumber: 1,
        pageCount: 1,
        totalItemCount: 1,
        itemCountPerPage: 10,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockNotifications,
        pagination: mockPagination,
      })

      const result = await notificationsResource.listForOrders()

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/notification-for-order',
      })
      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toEqual(mockNotifications)
    })

    it('should list notifications for orders with parameters', async () => {
      const params = {
        page: 3,
        limit: 50,
        type: 'email' as const,
        event: 'order.created',
        status: 'failed' as const,
        url: 'https://api.example.com/orders',
        searchId: 'search_orders_notif',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: [],
        pagination: {
          currentPageNumber: 3,
          pageCount: 3,
          totalItemCount: 150,
          itemCountPerPage: 50,
        },
      })

      await notificationsResource.listForOrders(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/notification-for-order',
        query: params,
      })
    })
  })

  describe('listForTransactions', () => {
    it('should list notifications for transactions without parameters', async () => {
      const mockNotifications = [mockNotification]
      const mockPagination = {
        currentPageNumber: 1,
        pageCount: 1,
        totalItemCount: 1,
        itemCountPerPage: 10,
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: mockNotifications,
        pagination: mockPagination,
      })

      const result = await notificationsResource.listForTransactions()

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/notification-for-transaction',
      })
      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toEqual(mockNotifications)
    })

    it('should list notifications for transactions with parameters', async () => {
      const params = {
        page: 1,
        limit: 100,
        type: 'webhook' as const,
        event: 'transaction.refunded',
        status: 'pending' as const,
        url: 'https://webhook.site/test',
        searchId: 'search_trans_notif',
      }

      mockCore.request = vi.fn().mockResolvedValue({
        data: [mockNotification],
        pagination: {
          currentPageNumber: 1,
          pageCount: 1,
          totalItemCount: 1,
          itemCountPerPage: 100,
        },
      })

      await notificationsResource.listForTransactions(params)

      expect(mockCore.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/notification-for-transaction',
        query: params,
      })
    })

    it('should handle failed notification with retry info', async () => {
      const failedNotification: Notification = {
        ...mockNotification,
        message: 'transactionFail',
        // response: {
        //   status: 500,
        //   headers: {},
        //   body: 'Internal Server Error',
        // },
      }

      mockCore.request = vi.fn().mockResolvedValue({
        code: 500,
        data: [failedNotification],
        pagination: {
          currentPageNumber: 1,
          pageCount: 1,
          totalItemCount: 1,
          itemCountPerPage: 10,
        },
      })

      const result = await notificationsResource.listForTransactions({ message: ['transactionFail'] })

      expect(result.data[0].message).toBe('transactionFail')
      // expect(result.data[0].attempts).toBe(3)
      // expect(result.data[0].nextAttemptAt).toEqual(new Date('2025-01-01T13:00:00Z'))
      // expect(result.data[0].response?.status).toBe(500)
    })

    it('should handle different event types', async () => {
      const messages = ['orderNew', 'orderChange', 'orderExtend', 'orderRetrying', 'orderInProgress', 'orderCancel', 'transactionNew', 'transactionCapture', 'transactionFail'] as const

      for (const message of messages) {
        mockCore.request = vi.fn().mockResolvedValue({
          data: [],
          pagination: {
            currentPageNumber: 1,
            pageCount: 0,
            totalItemCount: 0,
            itemCountPerPage: 10,
          },
        })

        await notificationsResource.list({ message: [message] })

        expect(mockCore.request).toHaveBeenCalledWith({
          method: 'GET',
          path: '/notification',
          query: { message: [message] },
        })
      }
    })
  })
})

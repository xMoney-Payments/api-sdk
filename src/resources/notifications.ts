import type { ApiResponse, XMoneyCore } from '../types'
import { PaginatedList } from '../core'

/**
 * Notification message types for webhook events
 */
export type NotificationMessage =
  | 'orderNew'
  | 'orderChange'
  | 'orderExtend'
  | 'orderRetrying'
  | 'orderInProgress'
  | 'orderCancel'
  | 'transactionNew'
  | 'transactionCapture'
  | 'transactionFail'
  | 'transactionRefund'
  | 'transactionCancel'
  | 'transactionVoid'
  | 'transactionChargeBack'
  | 'transactionCredit'
  | 'transaction3D'
  | 'receiptSend'

/**
 * Webhook notification record
 */
export interface Notification {
  /**
   * Notification ID
   */
  id: number
  /**
   * Site ID
   */
  siteId: number
  /**
   * ID of the resource (order or transaction)
   */
  resourceId: number
  /**
   * Type of resource
   */
  resourceType: 'order' | 'transaction'
  /**
   * Notification message type
   */
  message: NotificationMessage
  /**
   * ISO 8601 date-time when notification was created
   */
  creationDate: string
  /**
   * Unix timestamp of creation
   */
  creationTimestamp: number
}

/**
 * Parameters for listing notifications
 */
export interface NotificationListParams {
  /**
   * Search ID from previous search
   */
  searchId?: string
  /**
   * Filter by parent resource type
   */
  parentResourceType?: 'partner' | 'merchant' | 'site'
  /**
   * Filter by parent resource IDs
   */
  parentResourceId?: number[]
  /**
   * Filter notifications with ID greater than
   */
  greaterThanId?: number
  /**
   * Filter by resource ID
   */
  resourceId?: number
  /**
   * Filter by resource type
   */
  resourceType?: 'order' | 'transaction'
  /**
   * Filter by notification message types
   */
  message?: NotificationMessage[]
  /**
   * Filter by occurrence date from
   */
  occurredAtFrom?: Date
  /**
   * Filter by occurrence date to
   */
  occurredAtTo?: Date
  /**
   * Page number
   */
  page?: number
  /**
   * Items per page
   */
  perPage?: number
}

/**
 * Parameters for listing order-specific notifications
 */
export interface OrderNotificationListParams {
  parentResourceType?: 'partner' | 'merchant' | 'site'
  parentResourceId?: number[]
  greaterThanId?: number
  message?: Array<'orderNew' | 'orderChange' | 'orderExtend' | 'orderRetrying' | 'orderInProgress' | 'orderCancel'>
  occurredAtFrom?: Date
  occurredAtTo?: Date
  page?: number
  perPage?: number
}

/**
 * Parameters for listing transaction-specific notifications
 */
export interface TransactionNotificationListParams {
  parentResourceType?: 'partner' | 'merchant' | 'site'
  parentResourceId?: number[]
  greaterThanId?: number
  message?: Array<'transactionNew' | 'transactionCapture' | 'transactionFail' | 'transactionRefund' | 'transactionCancel' | 'transactionVoid' | 'transactionChargeBack' | 'transaction3D' | 'transactionCredit' | 'receiptSend'>
  occurredAtFrom?: Date
  occurredAtTo?: Date
  page?: number
  perPage?: number
}

/**
 * Resource for managing webhook notifications
 *
 * Use to retrieve notification history for orders and transactions
 *
 * @example
 * ```typescript
 * const xMoney = createXMoneyClient({ apiKey: 'your-api-key' })
 *
 * // List all notifications
 * const notifications = await xMoney.notifications.list({
 *   greaterThanId: lastProcessedId
 * })
 *
 * // Process new notifications
 * for await (const notification of notifications) {
 *   if (notification.message === 'transactionNew') {
 *     // Handle new transaction
 *   }
 * }
 * ```
 */
export class NotificationsResource {
  constructor(private client: XMoneyCore) {}

  /**
   * List all notifications
   * @param params - List parameters
   * @returns Paginated list of notifications
   */
  async list(params?: NotificationListParams): Promise<PaginatedList<Notification>> {
    const response = await this.client.request<Notification[]>({
      method: 'GET',
      path: '/notification',
      query: params,
    })

    // Create a fetch function for pagination
    const fetchNextPage = async (page: number): Promise<ApiResponse<Notification[]>> => {
      return this.client.request<Notification[]>({
        method: 'GET',
        path: '/notification',
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
   * List notifications for orders only
   * @param params - List parameters
   * @returns Paginated list of order notifications
   *
   * @example
   * ```typescript
   * const orderNotifications = await xMoney.notifications.listForOrders({
   *   message: ['orderNew', 'orderChange'],
   *   occurredAtFrom: '2024-01-01T00:00:00Z'
   * })
   * ```
   */
  async listForOrders(params?: OrderNotificationListParams): Promise<PaginatedList<Notification>> {
    const response = await this.client.request<Notification[]>({
      method: 'GET',
      path: '/notification-for-order',
      query: params,
    })

    // Create a fetch function for pagination
    const fetchNextPage = async (page: number): Promise<ApiResponse<Notification[]>> => {
      return this.client.request<Notification[]>({
        method: 'GET',
        path: '/notification-for-order',
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
   * List notifications for transactions only
   * @param params - List parameters
   * @returns Paginated list of transaction notifications
   *
   * @example
   * ```typescript
   * const txNotifications = await xMoney.notifications.listForTransactions({
   *   message: ['transactionNew', 'transactionFail'],
   *   greaterThanId: lastId
   * })
   * ```
   */
  async listForTransactions(params?: TransactionNotificationListParams): Promise<PaginatedList<Notification>> {
    const response = await this.client.request<Notification[]>({
      method: 'GET',
      path: '/notification-for-transaction',
      query: params,
    })

    // Create a fetch function for pagination
    const fetchNextPage = async (page: number): Promise<ApiResponse<Notification[]>> => {
      return this.client.request<Notification[]>({
        method: 'GET',
        path: '/notification-for-transaction',
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
}

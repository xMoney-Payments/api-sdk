import type { ApiResponse, XMoneyCore } from '../types'
import { PaginatedList } from '../core/pagination'

export interface Notification {
  id: number
  siteId: number
  resourceId: number
  resourceType: 'order' | 'transaction'
  message: NotificationMessage
  creationDate: string
  creationTimestamp: number
}

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

export class NotificationsResource {
  constructor(private client: XMoneyCore) {}

  async list(params?: {
    searchId?: string
    parentResourceType?: 'partner' | 'merchant' | 'site'
    parentResourceId?: number[]
    greaterThanId?: number
    resourceId?: number
    resourceType?: 'order' | 'transaction'
    message?: NotificationMessage[]
    occurredAtFrom?: string
    occurredAtTo?: string
    page?: number
    perPage?: number
  }): Promise<PaginatedList<Notification>> {
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

  async listForOrders(params?: {
    parentResourceType?: 'partner' | 'merchant' | 'site'
    parentResourceId?: number[]
    greaterThanId?: number
    message?: Array<'orderNew' | 'orderChange' | 'orderExtend' | 'orderRetrying' | 'orderInProgress' | 'orderCancel'>
    occurredAtFrom?: string
    occurredAtTo?: string
    page?: number
    perPage?: number
  }): Promise<PaginatedList<Notification>> {
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

  async listForTransactions(params?: {
    parentResourceType?: 'partner' | 'merchant' | 'site'
    parentResourceId?: number[]
    greaterThanId?: number
    message?: Array<'transactionNew' | 'transactionCapture' | 'transactionFail' | 'transactionRefund' | 'transactionCancel' | 'transactionVoid' | 'transactionChargeBack' | 'transaction3D' | 'transactionCredit' | 'receiptSend'>
    occurredAtFrom?: string
    occurredAtTo?: string
    page?: number
    perPage?: number
  }): Promise<PaginatedList<Notification>> {
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

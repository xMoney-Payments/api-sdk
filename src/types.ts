import type { BinaryLike, Hmac, KeyObject } from 'node:crypto'
import type stream from 'node:stream'
import type { HttpClient, HttpMethod } from './http'

export interface XMoneyConfig {
  apiKey: string
  secureToken?: string
  host?: string
  timeout?: number
  maxRetries?: number
  httpClient?: HttpClient
}

export interface XMoneyCore {
  request: <T>(options: RequestOptions) => Promise<ApiResponse<T>>
  config: Readonly<XMoneyConfig>
}

export interface RequestOptions {
  method: HttpMethod
  path: string
  query?: Record<string, any>
  body?: Record<string, any>
  headers?: Record<string, string>
}

export interface ApiResponse<T> {
  code: number
  message: string
  data?: T
  error?: ApiError[]
  pagination?: Pagination
  searchParams?: Record<string, any>
}

export interface ApiError {
  code: number
  message: string
  type?: 'Exception' | 'Validation'
  field?: string
}

export interface Pagination {
  currentPageNumber: number
  totalItemCount: number
  itemCountPerPage: number
  currentItemCount: number
  pageCount: number
}

export interface PlatformAdapter {
  createHmac: (algorithm: string, key: BinaryLike | KeyObject, options?: stream.TransformOptions) => Hmac
  base64Encode: (data: string) => string
  urlEncode: (params: Record<string, any>) => string
}

export type * from './http'
export type * from './resources'

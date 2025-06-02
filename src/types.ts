import type { HttpClient, HttpMethod, HttpProtocol } from './http'
import type { PlatformProvider } from './platform/types'

/**
 * Configuration options for the XMoney SDK client
 */
export interface XMoneyConfig {
  /**
   * API key for authentication with XMoney Payment Gateway
   */
  apiKey: string
  /**
   * Optional secure token for card operations
   */
  secureToken?: string
  /**
   * API host (default: 'api.xmoney.com')
   */
  host?: string
  /**
   * API port (default: 443 for https, 80 for http)
   */
  port?: string | number
  /**
   * Protocol to use for API requests
   * @default 'https'
   */
  protocol?: HttpProtocol
  /**
   * Request timeout in milliseconds
   * @default 80000
   */
  timeout?: number
  /**
   * Maximum number of retry attempts for failed requests
   * @default 3
   */
  maxRetries?: number
  /**
   * HTTP client implementation (platform-specific)
   */
  httpClient?: HttpClient
  /**
   * Platform provider for crypto operations (platform-specific)
   */
  platformProvider?: PlatformProvider
}

/**
 * Core interface for XMoney client operations
 */
export interface XMoneyCore {
  /**
   * Make an API request to XMoney
   * @param options - Request configuration
   * @returns Promise resolving to the API response
   */
  request: <T>(options: RequestOptions) => Promise<ApiResponse<T>>
  /**
   * Read-only access to the client configuration
   */
  config: Readonly<XMoneyConfig>
}

/**
 * Options for making API requests
 */
export interface RequestOptions {
  /**
   * HTTP method for the request
   */
  method: HttpMethod
  /**
   * API endpoint path
   */
  path: string
  /**
   * Query parameters to append to the URL
   */
  query?: Record<string, any>
  /**
   * Request body data (will be form-encoded)
   */
  body?: Record<string, any>
  /**
   * Additional headers to include in the request
   */
  headers?: Record<string, string>
}

/**
 * Standard API response format from XMoney
 * @template T - The type of data in the response
 */
export interface ApiResponse<T> {
  /**
   * Response code indicating success or failure
   */
  code: number
  /**
   * Human-readable response message
   */
  message: string
  /**
   * Response payload containing the requested data
   */
  data?: T
  /**
   * Array of errors if the request failed
   */
  error?: ApiError[]
  /**
   * Pagination metadata for list endpoints
   */
  pagination?: Pagination
  /**
   * Search parameters used in the request
   */
  searchParams?: Record<string, any>
}

/**
 * Error details from API responses
 */
export interface ApiError {
  /**
   * Error code
   */
  code: number
  /**
   * Error message describing the issue
   */
  message: string
  /**
   * Type of error (Exception or Validation)
   */
  type?: 'Exception' | 'Validation'
  /**
   * Field name for validation errors
   */
  field?: string
}

/**
 * Pagination metadata for list responses
 */
export interface Pagination {
  /**
   * Current page number (1-indexed)
   */
  currentPageNumber: number
  /**
   * Total number of items across all pages
   */
  totalItemCount: number
  /**
   * Number of items per page
   */
  itemCountPerPage: number
  /**
   * Number of items on the current page
   */
  currentItemCount: number
  /**
   * Total number of pages
   */
  pageCount: number
}

export type * from './http'
export type * from './platform/types'
export type * from './resources'

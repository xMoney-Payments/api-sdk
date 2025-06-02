import type { ApiResponse, HttpClient, PlatformProvider, RequestOptions, XMoneyConfig, XMoneyCore } from '../types'
import { DateTransformer } from '../utils'
import { XMoneyError } from './error'

/**
 * Core client for interacting with the XMoney Payment Gateway API
 *
 * This client handles:
 * - Authentication with API key
 * - Request retry logic with exponential backoff
 * - Form-encoded request bodies
 * - Date transformation for API compatibility
 * - Platform-specific HTTP and crypto operations
 */
export class XMoneyClient implements XMoneyCore {
  /**
   * Client configuration (read-only)
   */
  readonly config: Readonly<XMoneyConfig>
  /**
   * Platform-specific HTTP client for making requests
   */
  private readonly httpClient: HttpClient
  /**
   * Platform-specific provider for crypto operations
   */
  private readonly platformProvider: PlatformProvider

  /**
   * Create a new XMoney client instance
   * @param config - Configuration object or API key string
   * @throws {Error} If HTTP client or platform provider is not provided
   *
   * @example
   * ```typescript
   * // With API key only
   * const client = new XMoneyClient('your-api-key')
   *
   * // With full configuration
   * const client = new XMoneyClient({
   *   apiKey: 'your-api-key',
   *   host: 'api.xmoney.com',
   *   maxRetries: 5
   * })
   * ```
   */
  constructor(config: XMoneyConfig | string) {
    const defaultConfig: Partial<XMoneyConfig> = {
      protocol: 'https',
      host: 'api.xmoney.com',
      timeout: 80000,
      maxRetries: 3,
    }

    if (typeof config === 'string') {
      this.config = { ...defaultConfig, apiKey: config }
    }
    else {
      let finalConfig = { ...defaultConfig }

      if (config.host && (config.host.startsWith('http://') || config.host.startsWith('https://'))) {
        const url = new URL(config.host)

        // Apply config but use parsed URL components
        finalConfig = {
          ...defaultConfig,
          ...config,
          host: url.hostname,
          protocol: config.protocol ?? url.protocol.replace(':', '') as 'http' | 'https',
          port: config.port ?? (url.port ? Number(url.port) : undefined),
        }
      }
      else {
        // No URL parsing needed
        finalConfig = { ...finalConfig, ...config }
      }

      this.config = finalConfig as XMoneyConfig
    }

    // HTTP client must be provided
    if (!this.config.httpClient) {
      throw new Error('HTTP client is required')
    }
    this.httpClient = this.config.httpClient

    // Platform provider must be provided
    if (!this.config.platformProvider) {
      throw new Error('Platform provider is required')
    }
    this.platformProvider = this.config.platformProvider
  }

  /**
   * Make an authenticated request to the XMoney API
   *
   * @template T - Expected response data type
   * @param options - Request configuration
   * @returns Promise resolving to the API response
   * @throws {XMoneyError} If the request fails or returns an error response
   *
   * Features:
   * - Automatic retry with exponential backoff for server errors (5xx)
   * - Form-encoded request bodies for POST/PUT/PATCH/DELETE
   * - Date serialization to API format
   * - Query parameter handling with array support
   */
  async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    // Transform dates in query and body parameters
    const transformedOptions = {
      ...options,
      query: options.query ? DateTransformer.toApi(options.query) : undefined,
      body: options.body ? DateTransformer.toApi(options.body) : undefined,
    }

    // Build path with query parameters
    let path = transformedOptions.path.startsWith('/') ? transformedOptions.path : `/${transformedOptions.path}`

    // Add query parameters
    if (transformedOptions.query) {
      const params = new URLSearchParams()
      Object.entries(transformedOptions.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)))
          }
          else {
            params.append(key, String(value))
          }
        }
      })
      const queryString = params.toString()
      if (queryString) {
        path += `?${queryString}`
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      ...transformedOptions.headers,
    }

    // Add secure token if provided (for card operations)
    if (this.config.secureToken) {
      headers['x-secure-token'] = this.config.secureToken
    }

    let body: string | undefined
    if (transformedOptions.body && (transformedOptions.method === 'POST' || transformedOptions.method === 'PUT' || transformedOptions.method === 'PATCH' || transformedOptions.method === 'DELETE')) {
      // XMoney uses form-encoded data
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
      body = this.encodeFormData(transformedOptions.body)
    }

    let lastError: Error
    const maxRetries = this.config.maxRetries || 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient.request({
          method: transformedOptions.method,
          protocol: this.config.protocol!,
          host: this.config.host!,
          port: this.config.port || (this.config.protocol === 'https' ? 443 : 80),
          path,
          headers,
          body,
          timeout: this.config.timeout!,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new XMoneyError(data.message || 'Request failed', {
            statusCode: response.status,
            code: data.code,
            errors: data.error,
          })
        }

        return data
      }
      catch (error) {
        lastError = error as Error

        // Don't retry on client errors (4xx)
        if (error instanceof XMoneyError && error.details.statusCode && error.details.statusCode < 500) {
          throw error
        }

        // Retry with exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * 2 ** (attempt - 1), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // eslint-disable-next-line no-throw-literal
    throw lastError!
  }

  /**
   * Encode data as application/x-www-form-urlencoded
   *
   * Supports nested objects and arrays using bracket notation:
   * - Objects: `parent[child]=value`
   * - Arrays: `parent[]=value1&parent[]=value2`
   *
   * @param data - Data to encode
   * @returns Form-encoded string
   */
  private encodeFormData(data: Record<string, any>): string {
    // Note: URLSearchParams is available in Node.js 10+ and all modern browsers
    // For older environments, a polyfill may be needed
    const params = new URLSearchParams()

    const encode = (obj: any, prefix: string = ''): void => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}[${key}]` : key

        if (value === null || value === undefined)
          return

        if (Array.isArray(value)) {
          value.forEach(v => params.append(`${fullKey}[]`, String(v)))
        }
        else if (typeof value === 'object') {
          encode(value, fullKey)
        }
        else {
          params.append(fullKey, String(value))
        }
      })
    }

    encode(data)
    return params.toString()
  }
}

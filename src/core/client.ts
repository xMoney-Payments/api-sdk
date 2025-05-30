import type { ApiResponse, HttpClient, PlatformProvider, RequestOptions, XMoneyConfig, XMoneyCore } from '../types'
import { DateTransformer } from '../utils'
import { XMoneyError } from './error'

export class XMoneyClient implements XMoneyCore {
  readonly config: Readonly<XMoneyConfig>
  private readonly httpClient: HttpClient
  private readonly platformProvider: PlatformProvider

  constructor(config: XMoneyConfig | string) {
    this.config = typeof config === 'string'
      ? { apiKey: config, host: 'https://api-stage.xmoney.com', timeout: 80000, maxRetries: 3 }
      : { host: 'https://api-stage.xmoney.com', timeout: 80000, maxRetries: 3, ...config }

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

  async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    // Transform dates in query and body parameters
    const transformedOptions = {
      ...options,
      query: options.query ? DateTransformer.toApi(options.query) : undefined,
      body: options.body ? DateTransformer.toApi(options.body) : undefined,
    }

    // Build full URL - URL constructor is available in Node.js 10+ and all browsers
    const baseUrl = this.config.host!.endsWith('/') ? this.config.host!.slice(0, -1) : this.config.host!
    const path = transformedOptions.path.startsWith('/') ? transformedOptions.path : `/${transformedOptions.path}`
    const url = new URL(baseUrl + path)

    // Add query parameters
    if (transformedOptions.query) {
      Object.entries(transformedOptions.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)))
          }
          else {
            url.searchParams.append(key, String(value))
          }
        }
      })
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
          url: url.toString(),
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

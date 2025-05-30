import type { HttpClient, HttpRequestOptions, HttpResponse } from './types'

export class FetchHttpClient implements HttpClient {
  constructor(private fetchFn: typeof fetch = globalThis.fetch) {
    if (!this.fetchFn) {
      throw new Error('Fetch is not available. Please provide a fetch implementation or use NodeHttpClient.')
    }
  }

  async request(options: HttpRequestOptions): Promise<HttpResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout)

    try {
      const url = this.buildUrl(options)
      const response = await this.fetchFn(url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      })

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
        json: () => response.json(),
        text: () => response.text(),
      }
    }
    finally {
      clearTimeout(timeoutId)
    }
  }

  private buildUrl(options: HttpRequestOptions): string {
    const { protocol, host, port, path } = options
    const portString = port && port !== (protocol === 'https' ? 443 : 80) ? `:${port}` : ''
    return `${protocol}://${host}${portString}${path}`
  }

  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value
    })
    return result
  }
}

import type { RequestOptions } from 'node:https'
import type { HttpClient, HttpRequestOptions, HttpResponse } from './types'
import * as http_ from 'node:http'
import * as https_ from 'node:https'

// Preserve compatibility with HTTP interception tools like MSW (Mock Service Worker)
// by accessing the CommonJS module instead of the immutable ES module namespace.
// This allows testing libraries to mock network requests at runtime.
const http = ((http_ as unknown) as { default: typeof http_ }).default || http_
const https = ((https_ as unknown) as { default: typeof https_ }).default || https_

export class NodeHttpClient implements HttpClient {
  async request(options: HttpRequestOptions): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      const isHttps = options.protocol === 'https'

      const requestOptions: RequestOptions = {
        hostname: options.host,
        port: options.port || (isHttps ? 443 : 80),
        path: options.path,
        method: options.method,
        headers: options.headers,
        timeout: options.timeout,
      }

      const req = (isHttps ? https : http).request(requestOptions, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          resolve({
            ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode || 0,
            statusText: res.statusMessage || '',
            headers: res.headers as Record<string, string>,
            json: async () => JSON.parse(data),
            text: async () => data,
          })
        })
      })

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      if (options.body) {
        req.write(options.body)
      }

      req.end()
    })
  }
}

import type { HttpClient, HttpRequestOptions, HttpResponse } from './types'

export class NodeHttpClient implements HttpClient {
  async request(options: HttpRequestOptions): Promise<HttpResponse> {
    // Dynamic imports to avoid bundling Node.js modules in browser builds
    const [{ request: httpsRequest }, { request: httpRequest }, { URL }] = await Promise.all([
      import('node:https'),
      import('node:http'),
      import('node:url'),
    ])

    return new Promise((resolve, reject) => {
      const url = new URL(options.url)
      const isHttps = url.protocol === 'https:'
      const request = isHttps ? httpsRequest : httpRequest

      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method,
        headers: options.headers,
        timeout: options.timeout,
      }

      const req = request(requestOptions, (res) => {
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

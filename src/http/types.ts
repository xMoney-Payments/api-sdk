// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE'
export type HttpProtocol = 'http' | 'https'

export interface HttpClient {
  request: (options: HttpRequestOptions) => Promise<HttpResponse>
}

export interface HttpRequestOptions {
  host: string
  port: string | number
  path: string
  method: HttpMethod
  headers: Record<string, string>
  body?: string
  protocol: HttpProtocol
  timeout: number
}

export interface HttpResponse {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  json: () => Promise<any>
  text: () => Promise<string>
}

// https://www.rfc-editor.org/rfc/rfc7231#section-4.1
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE'

export interface HttpClient {
  request: (options: HttpRequestOptions) => Promise<HttpResponse>
}

export interface HttpRequestOptions {
  method: HttpMethod
  url: string
  headers: Record<string, string>
  body?: string
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

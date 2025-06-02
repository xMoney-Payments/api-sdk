import type { HttpRequestOptions } from '../../src/http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FetchHttpClient } from '../../src/http'

describe('fetchHttpClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  let client: FetchHttpClient

  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch = vi.fn()
    client = new FetchHttpClient(mockFetch)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should create client with provided fetch function', () => {
      expect(() => new FetchHttpClient(mockFetch)).not.toThrow()
    })

    it('should throw error if no fetch function available', () => {
      const originalFetch = globalThis.fetch
      delete (globalThis as any).fetch

      expect(() => new FetchHttpClient())
        .toThrow('Fetch is not available. Please provide a fetch implementation or use NodeHttpClient.')

      globalThis.fetch = originalFetch
    })

    it('should use global fetch if available', () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = mockFetch

      const clientWithGlobal = new FetchHttpClient()
      expect(() => clientWithGlobal).not.toThrow()

      globalThis.fetch = originalFetch
    })
  })

  describe('request', () => {
    const mockHeaders = new Map([
      ['Content-Type', 'application/json'],
      ['X-Custom-Header', 'value'],
    ])

    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
      json: vi.fn().mockResolvedValue({ data: 'test' }),
      text: vi.fn().mockResolvedValue('test response'),
    }

    beforeEach(() => {
      mockFetch.mockResolvedValue(mockResponse)
    })

    it('should make successful GET request', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: { Authorization: 'Bearer token' },
        timeout: 5000,
      }

      const response = await client.request(options)

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
        body: undefined,
        signal: expect.any(AbortSignal),
      })

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.statusText).toBe('OK')
      expect(await response.json()).toEqual({ data: 'test' })
    })

    it('should make POST request with body', async () => {
      const options: HttpRequestOptions = {
        method: 'POST',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
        timeout: 5000,
      }

      await client.request(options)

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
        signal: expect.any(AbortSignal),
      })
    })

    it('should handle error responses', async () => {
      mockFetch.mockResolvedValue({
        ...mockResponse,
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/notfound',
        headers: {},
        timeout: 5000,
      }

      const response = await client.request(options)

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
      expect(response.statusText).toBe('Not Found')
    })

    it('should parse headers correctly', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: {},
        timeout: 5000,
      }

      const response = await client.request(options)

      expect(response.headers).toEqual({
        'content-type': 'application/json',
        'x-custom-header': 'value',
      })
    })

    it('should handle timeout', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: {},
        timeout: 100,
      }

      // Create an abort error that will be thrown
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'

      // Mock fetch to throw when aborted
      mockFetch.mockImplementation((url: string, init: RequestInit) => {
        // Return a promise that rejects when abort signal fires
        return new Promise((resolve, reject) => {
          // If signal is already aborted, reject immediately
          if (init.signal?.aborted) {
            reject(abortError)
            return
          }

          // Set up abort handler
          init.signal?.addEventListener('abort', () => {
            reject(abortError)
          }, { once: true })

          // This timeout would resolve after 200ms (longer than abort timeout)
          // But it will be aborted before then
        })
      })

      // Start the request (don't await yet)
      const requestPromise = client.request(options)

      // Advance time to trigger the timeout
      vi.advanceTimersByTime(100)

      // Now the promise should reject
      await expect(requestPromise).rejects.toThrow('abort')

      // Verify fetch was called with abort signal
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      )
    })

    it('should clear timeout on successful response', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: {},
        timeout: 5000,
      }

      await client.request(options)

      expect(clearTimeoutSpy).toHaveBeenCalledOnce()
    })

    it('should clear timeout on error', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
      mockFetch.mockRejectedValue(new Error('Network error'))

      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: {},
        timeout: 5000,
      }

      try {
        await client.request(options)
      }
      catch {
        // Expected error
      }

      expect(clearTimeoutSpy).toHaveBeenCalledOnce()
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: {},
        timeout: 5000,
      }

      await expect(client.request(options)).rejects.toThrow('Network error')
    })

    it('should handle empty headers', async () => {
      mockFetch.mockResolvedValue({
        ...mockResponse,
        headers: new Map(),
      })

      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: {},
        timeout: 5000,
      }

      const response = await client.request(options)

      expect(response.headers).toEqual({})
    })

    it('should convert header names to lowercase', async () => {
      const mixedCaseHeaders = new Map([
        ['Content-Type', 'application/json'],
        ['X-Custom-HEADER', 'value'],
      ])

      mockFetch.mockResolvedValue({
        ...mockResponse,
        headers: mixedCaseHeaders,
      })

      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: {},
        timeout: 5000,
      }

      const response = await client.request(options)

      expect(response.headers).toEqual({
        'content-type': 'application/json',
        'x-custom-header': 'value',
      })
    })

    it('should provide text method', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: {},
        timeout: 5000,
      }

      const response = await client.request(options)
      const text = await response.text()

      expect(text).toBe('test response')
      expect(mockResponse.text).toHaveBeenCalledOnce()
    })

    it('should build URL correctly with custom port', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 8443,
        path: '/test',
        headers: {},
        timeout: 5000,
      }

      await client.request(options)

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com:8443/test', expect.any(Object))
    })

    it('should build URL correctly without port for default ports', async () => {
      const httpsOptions: HttpRequestOptions = {
        method: 'GET',
        protocol: 'https',
        host: 'api.example.com',
        port: 443,
        path: '/test',
        headers: {},
        timeout: 5000,
      }

      await client.request(httpsOptions)
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', expect.any(Object))

      const httpOptions: HttpRequestOptions = {
        method: 'GET',
        protocol: 'http',
        host: 'api.example.com',
        port: 80,
        path: '/test',
        headers: {},
        timeout: 5000,
      }

      await client.request(httpOptions)
      expect(mockFetch).toHaveBeenCalledWith('http://api.example.com/test', expect.any(Object))
    })
  })
})

import type { HttpClient, HttpResponse, PlatformProvider } from '../../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { XMoneyClient, XMoneyError } from '../../src/core'

describe('xMoneyClient', () => {
  let mockHttpClient: HttpClient
  let mockPlatformProvider: PlatformProvider
  let mockResponse: HttpResponse

  beforeEach(() => {
    mockResponse = {
      statusText: 'OK',
      ok: true,
      status: 200,
      headers: {},
      json: vi.fn().mockResolvedValue({ data: 'test' }),
      text: vi.fn().mockResolvedValue('test'),
    }

    mockHttpClient = {
      request: vi.fn().mockResolvedValue(mockResponse),
    }

    mockPlatformProvider = {
      crypto: {
        createHmacSha512: vi.fn(),
        createDecipherAes256Cbc: vi.fn(),
      },
      buffer: {
        from: vi.fn(),
        alloc: vi.fn(),
        byteLength: vi.fn(),
        concat: vi.fn(),
        toString: vi.fn(),
      },
    }
  })

  describe('constructor', () => {
    it('should create client with string API key', () => {
      const client = new XMoneyClient({
        apiKey: 'test-key',
        platformProvider: mockPlatformProvider,
        httpClient: mockHttpClient,
      })

      expect(client.config.apiKey).toBe('test-key')
      expect(client.config.host).toBe('https://api-stage.xmoney.com')
      expect(client.config.timeout).toBe(80000)
      expect(client.config.maxRetries).toBe(3)
    })

    it('should create client with config object', () => {
      const config = {
        apiKey: 'test-key',
        host: 'https://custom.api.com',
        timeout: 5000,
        maxRetries: 5,
        platformProvider: mockPlatformProvider,
        httpClient: mockHttpClient,
      }

      const client = new XMoneyClient(config)

      expect(client.config).toMatchObject({
        apiKey: 'test-key',
        host: 'https://custom.api.com',
        timeout: 5000,
        maxRetries: 5,
      })
    })

    it('should throw error if platform provider is not provided', () => {
      expect(() => new XMoneyClient({
        apiKey: 'test-key',
        httpClient: mockHttpClient,
      } as any)).toThrow('Platform provider is required')
    })
  })

  describe('request', () => {
    let client: XMoneyClient

    beforeEach(() => {
      client = new XMoneyClient({
        apiKey: 'test-key',
        platformProvider: mockPlatformProvider,
        httpClient: mockHttpClient,
      })
    })

    it('should make successful GET request', async () => {
      const response = await client.request({
        method: 'GET',
        path: '/test',
      })

      expect(response).toEqual({ data: 'test' })
      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api-stage.xmoney.com/test',
        headers: {
          Authorization: 'Bearer test-key',
        },
        body: undefined,
        timeout: 80000,
      })
    })

    it('should handle query parameters', async () => {
      await client.request({
        method: 'GET',
        path: '/test',
        query: {
          page: 1,
          limit: 10,
          filters: ['active', 'pending'],
          nullValue: null,
          undefinedValue: undefined,
        },
      })

      const callArgs = (mockHttpClient.request as any).mock.calls[0][0]
      const url = new URL(callArgs.url)

      expect(url.searchParams.get('page')).toBe('1')
      expect(url.searchParams.get('limit')).toBe('10')
      expect(url.searchParams.getAll('filters')).toEqual(['active', 'pending'])
      expect(url.searchParams.has('nullValue')).toBe(false)
      expect(url.searchParams.has('undefinedValue')).toBe(false)
    })

    it('should handle POST request with form data', async () => {
      await client.request({
        method: 'POST',
        path: '/test',
        body: {
          name: 'John',
          age: 30,
          hobbies: ['reading', 'coding'],
          address: {
            street: '123 Main St',
            city: 'NYC',
          },
        },
      })

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api-stage.xmoney.com/test',
        headers: {
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'name=John&age=30&hobbies%5B%5D=reading&hobbies%5B%5D=coding&address%5Bstreet%5D=123+Main+St&address%5Bcity%5D=NYC',
        timeout: 80000,
      })
    })

    it('should add secure token if provided', async () => {
      const clientWithToken = new XMoneyClient({
        apiKey: 'test-key',
        secureToken: 'secure-123',
        platformProvider: mockPlatformProvider,
        httpClient: mockHttpClient,
      })

      await clientWithToken.request({
        method: 'GET',
        path: '/test',
      })

      expect(mockHttpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-secure-token': 'secure-123',
          }),
        }),
      )
    })

    it('should handle API errors', async () => {
      mockResponse.ok = false
      mockResponse.status = 400
      mockResponse.json = vi.fn().mockResolvedValue({
        message: 'Bad request',
        code: 1001,
        error: [{ type: 'Validation', field: 'email', message: 'Invalid email' }],
      })

      await expect(client.request({
        method: 'GET',
        path: '/test',
      })).rejects.toThrow(XMoneyError)

      try {
        await client.request({ method: 'GET', path: '/test' })
      }
      catch (error) {
        expect(error).toBeInstanceOf(XMoneyError)
        expect((error as XMoneyError).message).toBe('Bad request')
        expect((error as XMoneyError).details).toEqual({
          statusCode: 400,
          code: 1001,
          errors: [{ type: 'Validation', field: 'email', message: 'Invalid email' }],
        })
      }
    })

    it('should retry on server errors', async () => {
      mockResponse.ok = false
      mockResponse.status = 500
      mockResponse.json = vi.fn().mockResolvedValue({ message: 'Server error' })

      mockHttpClient.request = vi.fn()
        .mockRejectedValueOnce(new XMoneyError('Server error', { statusCode: 500 }))
        .mockRejectedValueOnce(new XMoneyError('Server error', { statusCode: 500 }))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({ data: 'success' }),
        })

      const response = await client.request({
        method: 'GET',
        path: '/test',
      })

      expect(response).toEqual({ data: 'success' })
      expect(mockHttpClient.request).toHaveBeenCalledTimes(3)
    })

    it('should not retry on client errors', async () => {
      const clientError = new XMoneyError('Bad request', { statusCode: 400 })
      mockHttpClient.request = vi.fn().mockRejectedValue(clientError)

      await expect(client.request({
        method: 'GET',
        path: '/test',
      })).rejects.toThrow(clientError)

      expect(mockHttpClient.request).toHaveBeenCalledTimes(1)
    })

    it('should respect maxRetries configuration', async () => {
      const clientWithRetries = new XMoneyClient({
        apiKey: 'test-key',
        maxRetries: 2,
        platformProvider: mockPlatformProvider,
        httpClient: mockHttpClient,
      })

      mockHttpClient.request = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(clientWithRetries.request({
        method: 'GET',
        path: '/test',
      })).rejects.toThrow('Network error')

      expect(mockHttpClient.request).toHaveBeenCalledTimes(2)
    })

    it('should handle trailing slash in host URL', async () => {
      const clientWithSlash = new XMoneyClient({
        apiKey: 'test-key',
        host: 'https://api.example.com/',
        platformProvider: mockPlatformProvider,
        httpClient: mockHttpClient,
      })

      await clientWithSlash.request({
        method: 'GET',
        path: '/test',
      })

      const callArgs = (mockHttpClient.request as any).mock.calls[0][0]
      expect(callArgs.url).toBe('https://api.example.com/test')
    })

    it('should handle path without leading slash', async () => {
      await client.request({
        method: 'GET',
        path: 'test',
      })

      const callArgs = (mockHttpClient.request as any).mock.calls[0][0]
      expect(callArgs.url).toBe('https://api-stage.xmoney.com/test')
    })

    it('should merge custom headers', async () => {
      await client.request({
        method: 'GET',
        path: '/test',
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      })

      expect(mockHttpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'X-Custom-Header': 'custom-value',
          }),
        }),
      )
    })
  })

  describe('encodeFormData', () => {
    let client: XMoneyClient

    beforeEach(() => {
      client = new XMoneyClient({
        apiKey: 'test-key',
        platformProvider: mockPlatformProvider,
        httpClient: mockHttpClient,
      })
    })

    it('should encode nested objects correctly', async () => {
      await client.request({
        method: 'POST',
        path: '/test',
        body: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            preferences: {
              notifications: true,
              theme: 'dark',
            },
          },
        },
      })

      const callArgs = (mockHttpClient.request as any).mock.calls[0][0]
      const formData = new URLSearchParams(callArgs.body)

      expect(formData.get('user[name]')).toBe('John Doe')
      expect(formData.get('user[email]')).toBe('john@example.com')
      expect(formData.get('user[preferences][notifications]')).toBe('true')
      expect(formData.get('user[preferences][theme]')).toBe('dark')
    })

    it('should handle null and undefined values', async () => {
      await client.request({
        method: 'POST',
        path: '/test',
        body: {
          name: 'John',
          age: null,
          email: undefined,
          active: false,
          count: 0,
        },
      })

      const callArgs = (mockHttpClient.request as any).mock.calls[0][0]
      const formData = new URLSearchParams(callArgs.body)

      expect(formData.get('name')).toBe('John')
      expect(formData.has('age')).toBe(false)
      expect(formData.has('email')).toBe(false)
      expect(formData.get('active')).toBe('false')
      expect(formData.get('count')).toBe('0')
    })

    it('should handle arrays with bracket notation', async () => {
      await client.request({
        method: 'POST',
        path: '/test',
        body: {
          tags: ['javascript', 'typescript', 'node'],
          scores: [100, 200, 300],
        },
      })

      const callArgs = (mockHttpClient.request as any).mock.calls[0][0]
      const formData = new URLSearchParams(callArgs.body)

      expect(formData.getAll('tags[]')).toEqual(['javascript', 'typescript', 'node'])
      expect(formData.getAll('scores[]')).toEqual(['100', '200', '300'])
    })
  })
})

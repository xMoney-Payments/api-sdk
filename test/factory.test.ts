import type { HttpClient, PlatformProvider, XMoneyConfig } from '../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createXMoneyClientFactory } from '../src/factory'
import { CardsResource, CustomersResource, NotificationsResource, OrdersResource, TransactionsResource } from '../src/resources'

describe('createXMoneyClientFactory', () => {
  let mockHttpClient: HttpClient
  let mockPlatformProvider: PlatformProvider

  beforeEach(() => {
    mockHttpClient = {
      request: vi.fn(),
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

  describe('factory creation', () => {
    it('should create SDK with string API key', () => {
      const config = { apiKey: 'test-api-key', httpClient: mockHttpClient, platformProvider: mockPlatformProvider }
      const sdk = createXMoneyClientFactory(config)

      expect(sdk).toBeDefined()
      expect(sdk.customers).toBeInstanceOf(CustomersResource)
      expect(sdk.orders).toBeInstanceOf(OrdersResource)
      expect(sdk.transactions).toBeInstanceOf(TransactionsResource)
      expect(sdk.cards).toBeInstanceOf(CardsResource)
      expect(sdk.notifications).toBeInstanceOf(NotificationsResource)
      expect(typeof sdk.request).toBe('function')
    })

    it('should create SDK with config object', () => {
      const config: XMoneyConfig = {
        apiKey: 'test-api-key',
        host: 'https://custom.api.com',
        timeout: 5000,
        maxRetries: 5,
        secureToken: 'secure-123',
        httpClient: mockHttpClient,
        platformProvider: mockPlatformProvider,
      }

      const sdk = createXMoneyClientFactory(config)

      expect(sdk).toBeDefined()
      expect(sdk.customers).toBeInstanceOf(CustomersResource)
      expect(sdk.orders).toBeInstanceOf(OrdersResource)
      expect(sdk.transactions).toBeInstanceOf(TransactionsResource)
      expect(sdk.cards).toBeInstanceOf(CardsResource)
      expect(sdk.notifications).toBeInstanceOf(NotificationsResource)
    })

    it('should pass HTTP client to the SDK', () => {
      const config: XMoneyConfig = {
        apiKey: 'test-api-key',
        httpClient: mockHttpClient,
        platformProvider: mockPlatformProvider,
      }

      const sdk = createXMoneyClientFactory(config)

      // Test that the HTTP client is being used by making a request
      mockHttpClient.request = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: vi.fn().mockResolvedValue({ data: 'test' }),
        text: vi.fn().mockResolvedValue('test'),
      })

      sdk.request({
        method: 'GET',
        path: '/test',
      })

      expect(mockHttpClient.request).toHaveBeenCalled()
    })
  })

  describe('request method', () => {
    it('should bind request method to client instance', async () => {
      const config: XMoneyConfig = {
        apiKey: 'test-api-key',
        httpClient: mockHttpClient,
        platformProvider: mockPlatformProvider,
      }

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: vi.fn().mockResolvedValue({ data: 'success' }),
        text: vi.fn().mockResolvedValue('success'),
      }

      mockHttpClient.request = vi.fn().mockResolvedValue(mockResponse)

      const sdk = createXMoneyClientFactory(config)

      const result = await sdk.request({
        method: 'POST',
        path: '/test',
        body: { test: true },
      })

      expect(result).toEqual({ data: 'success' })
      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        protocol: 'https',
        host: 'api.xmoney.com',
        port: 443,
        path: '/test',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'test=true',
        timeout: 80000,
      })
    })

    it('should handle request errors', async () => {
      const config: XMoneyConfig = {
        apiKey: 'test-api-key',
        httpClient: mockHttpClient,
        platformProvider: mockPlatformProvider,
      }

      mockHttpClient.request = vi.fn().mockRejectedValue(new Error('Network error'))

      const sdk = createXMoneyClientFactory(config)

      await expect(sdk.request({
        method: 'GET',
        path: '/test',
      })).rejects.toThrow('Network error')
    })
  })

  describe('resource initialization', () => {
    it('should initialize all resources with the same client instance', () => {
      const config: XMoneyConfig = {
        apiKey: 'test-api-key',
        host: 'https://api.example.com',
        httpClient: mockHttpClient,
        platformProvider: mockPlatformProvider,
      }

      const sdk = createXMoneyClientFactory(config)

      // All resources should be properly initialized
      expect(sdk.customers).toBeDefined()
      expect(sdk.orders).toBeDefined()
      expect(sdk.transactions).toBeDefined()
      expect(sdk.cards).toBeDefined()
      expect(sdk.notifications).toBeDefined()

      // Test that resources can make requests
      mockHttpClient.request = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: vi.fn().mockResolvedValue({ data: { id: 123 } }),
        text: vi.fn().mockResolvedValue('{"data":{"id":123}}'),
      })

      // Example: calling a resource method
      sdk.customers.retrieve(123)

      expect(mockHttpClient.request).toHaveBeenCalled()
    })
  })

  describe('configuration merging', () => {
    it('should merge string config with defaults', () => {
      const sdk = createXMoneyClientFactory({ apiKey: 'api-key-123', httpClient: mockHttpClient, platformProvider: mockPlatformProvider })

      // Test that default configuration is applied
      mockHttpClient.request = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: vi.fn().mockResolvedValue({ data: 'test' }),
        text: vi.fn().mockResolvedValue('test'),
      })

      sdk.request({
        method: 'GET',
        path: '/test',
      })

      expect(mockHttpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          protocol: 'https',
          host: 'api.xmoney.com',
          port: 443,
          path: '/test',
          timeout: 80000,
          headers: expect.objectContaining({
            Authorization: 'Bearer api-key-123',
          }),
        }),
      )
    })

    it('should override defaults with provided config', () => {
      const config: XMoneyConfig = {
        apiKey: 'custom-key',
        host: 'https://custom.host.com',
        timeout: 10000,
        maxRetries: 10,
        httpClient: mockHttpClient,
        platformProvider: mockPlatformProvider,
      }

      const sdk = createXMoneyClientFactory(config)

      mockHttpClient.request = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: vi.fn().mockResolvedValue({ data: 'test' }),
        text: vi.fn().mockResolvedValue('test'),
      })

      sdk.request({
        method: 'GET',
        path: '/test',
      })

      expect(mockHttpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          protocol: 'https',
          host: 'custom.host.com',
          port: 443,
          path: '/test',
          timeout: 10000,
          headers: expect.objectContaining({
            Authorization: 'Bearer custom-key',
          }),
        }),
      )
    })
  })

  describe('secure token handling', () => {
    it('should include secure token in requests when provided', () => {
      const config: XMoneyConfig = {
        apiKey: 'test-key',
        secureToken: 'secure-token-123',
        httpClient: mockHttpClient,
        platformProvider: mockPlatformProvider,
      }

      const sdk = createXMoneyClientFactory(config)

      mockHttpClient.request = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: vi.fn().mockResolvedValue({ data: 'test' }),
        text: vi.fn().mockResolvedValue('test'),
      })

      sdk.request({
        method: 'POST',
        path: '/cards/test',
      })

      expect(mockHttpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-secure-token': 'secure-token-123',
          }),
        }),
      )
    })
  })

  describe('sDK interface', () => {
    it('should implement the complete XMoneySDK interface', () => {
      const sdk = createXMoneyClientFactory({ apiKey: 'test-key', httpClient: mockHttpClient, platformProvider: mockPlatformProvider })

      // Check that all required properties exist
      expect(sdk).toHaveProperty('customers')
      expect(sdk).toHaveProperty('orders')
      expect(sdk).toHaveProperty('transactions')
      expect(sdk).toHaveProperty('cards')
      expect(sdk).toHaveProperty('notifications')
      expect(sdk).toHaveProperty('request')

      // Check that they are the correct types
      expect(sdk.customers).toBeInstanceOf(CustomersResource)
      expect(sdk.orders).toBeInstanceOf(OrdersResource)
      expect(sdk.transactions).toBeInstanceOf(TransactionsResource)
      expect(sdk.cards).toBeInstanceOf(CardsResource)
      expect(sdk.notifications).toBeInstanceOf(NotificationsResource)
      expect(typeof sdk.request).toBe('function')
    })
  })
})

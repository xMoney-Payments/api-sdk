import type { PlatformProvider } from '../../src/platform/types'
import type { CheckoutCreateFormParams, CheckoutCreateParams, CheckoutResponse } from '../../src/resources'
import type { XMoneyCore } from '../../src/types'
import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CheckoutResource } from '../../src/resources'

describe('checkoutResource', () => {
  let mockCore: XMoneyCore
  let mockPlatform: PlatformProvider
  let checkoutResource: CheckoutResource

  beforeEach(() => {
    mockCore = {
      config: {
        apiKey: 'test-api-key-32-chars-padding!!!',
      },
      request: vi.fn(),
    } as any

    mockPlatform = {
      buffer: {
        from: vi.fn((input: string, encoding?: string) => {
          if (encoding === 'base64') {
            return Buffer.from(input, 'base64')
          }
          return Buffer.from(input, 'utf8')
        }),
        toString: vi.fn((buffer: Uint8Array, encoding: string) => {
          return Buffer.from(buffer).toString(encoding as any)
        }),
        concat: vi.fn((arrays: Uint8Array[]) => {
          return Buffer.concat(arrays.map(arr => Buffer.from(arr)))
        }),
        alloc: vi.fn(),
        byteLength: vi.fn(),
      },
      crypto: {
        createHmacSha512: vi.fn(() => ({
          update: vi.fn(),
          digest: vi.fn(() => Buffer.from('mock-hmac-digest')),
        })),
        createDecipherAes256Cbc: vi.fn(() => ({
          update: vi.fn((_data: Uint8Array) => Buffer.from('decrypted-')),
          final: vi.fn(() => Buffer.from('data')),
        })),
      },
    } as any

    checkoutResource = new CheckoutResource(mockCore, mockPlatform)
  })

  describe('create', () => {
    const validParams: CheckoutCreateParams = {
      publicKey: 'pk_test_site123',
      cardTransactionMode: 'authAndCapture',
      backUrl: 'https://example.com/callback',
      customer: {
        identifier: 'cust_123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        country: 'US',
        city: 'New York',
        tags: ['vip', 'frequent'],
      },
      order: {
        orderId: 'order_123',
        type: 'purchase',
        amount: 10000,
        currency: 'USD',
        description: 'Test order',
      },
      invoiceEmail: 'invoice@example.com',
      saveCard: true,
    }

    it('should create checkout with valid parameters', () => {
      const result = checkoutResource.create(validParams)

      expect(result).toHaveProperty('payload')
      expect(result).toHaveProperty('checksum')
      expect(typeof result.payload).toBe('string')
      expect(typeof result.checksum).toBe('string')

      // Verify the payload is base64 encoded
      const decodedPayload = Buffer.from(result.payload, 'base64').toString('utf8')
      const payloadData = JSON.parse(decodedPayload)

      expect(payloadData).toMatchObject({
        siteId: 'site123',
        saveCard: true,
        cardTransactionMode: 'authAndCapture',
        backUrl: 'https://example.com/callback',
        customer: validParams.customer,
        order: validParams.order,
        invoiceEmail: 'invoice@example.com',
      })

      // Verify HMAC was called
      expect(mockPlatform.crypto.createHmacSha512).toHaveBeenCalledWith('test-api-key-32-chars-padding!!!')
    })

    it('should extract siteId from publicKey', () => {
      const result = checkoutResource.create({
        ...validParams,
        publicKey: 'pk_live_mysite456',
      })

      const decodedPayload = Buffer.from(result.payload, 'base64').toString('utf8')
      const payloadData = JSON.parse(decodedPayload)

      expect(payloadData.siteId).toBe('mysite456')
    })

    it('should default saveCard to false if not provided', () => {
      const params = { ...validParams }
      delete params.saveCard

      const result = checkoutResource.create(params)

      const decodedPayload = Buffer.from(result.payload, 'base64').toString('utf8')
      const payloadData = JSON.parse(decodedPayload)

      expect(payloadData.saveCard).toBe(false)
    })

    it('should work with minimal required parameters', () => {
      const minimalParams: CheckoutCreateParams = {
        publicKey: 'pk_test_site789',
        cardTransactionMode: 'auth',
        backUrl: 'https://example.com/back',
        customer: {
          identifier: 'cust_min',
        },
        order: {
          orderId: 'order_min',
          type: 'purchase',
          amount: 1000,
          currency: 'EUR',
          description: 'Minimal order',
        },
      }

      const result = checkoutResource.create(minimalParams)

      expect(result).toHaveProperty('payload')
      expect(result).toHaveProperty('checksum')

      const decodedPayload = Buffer.from(result.payload, 'base64').toString('utf8')
      const payloadData = JSON.parse(decodedPayload)

      expect(payloadData).toMatchObject({
        siteId: 'site789',
        saveCard: false,
        cardTransactionMode: 'auth',
        backUrl: 'https://example.com/back',
        customer: { identifier: 'cust_min' },
        order: minimalParams.order,
      })
    })

    it('should throw error if publicKey is missing', () => {
      const params = { ...validParams, publicKey: '' }

      expect(() => checkoutResource.create(params))
        .toThrow('Public key is required for hosted checkout')
    })

    it('should throw error if publicKey has invalid format', () => {
      const params = { ...validParams, publicKey: 'invalid_key_format' }

      expect(() => checkoutResource.create(params))
        .toThrow('Invalid public key format. Expected: pk_<env>_<key>')
    })

    it('should accept pk_test_ prefix', () => {
      const params = { ...validParams, publicKey: 'pk_test_validsite' }

      expect(() => checkoutResource.create(params)).not.toThrow()
    })

    it('should accept pk_live_ prefix', () => {
      const params = { ...validParams, publicKey: 'pk_live_validsite' }

      expect(() => checkoutResource.create(params)).not.toThrow()
    })
  })

  describe('form', () => {
    const validParams: CheckoutCreateFormParams = {
      publicKey: 'pk_test_site123',
      cardTransactionMode: 'authAndCapture',
      backUrl: 'https://example.com/callback',
      customer: {
        identifier: 'cust_123',
        email: 'john@example.com',
      },
      order: {
        orderId: 'order_123',
        type: 'purchase',
        amount: 10000,
        currency: 'USD',
        description: 'Test order',
      },
    }

    it('should generate form HTML with default URL', () => {
      const html = checkoutResource.form(validParams)

      expect(html).toContain('<form id="checkout-form"')
      expect(html).toContain('action="https://secure.twispay.com"')
      expect(html).toContain('method="POST"')
      expect(html).toContain('<input type="hidden" name="jsonRequest"')
      expect(html).toContain('<input type="hidden" name="checksum"')
      expect(html).toContain('window.onload')
      expect(html).toContain('document.checkoutForm.submit()')
    })

    it('should use custom URL when provided', () => {
      const html = checkoutResource.form({
        ...validParams,
        url: 'https://custom-checkout.example.com',
      })

      expect(html).toContain('action="https://custom-checkout.example.com"')
    })

    it('should handle null URL and use default', () => {
      const html = checkoutResource.form({
        ...validParams,
        url: null,
      })

      expect(html).toContain('action="https://secure.twispay.com"')
    })

    it('should include valid payload and checksum in form', () => {
      const html = checkoutResource.form(validParams)

      // Extract payload and checksum from HTML
      const payloadMatch = html.match(/name="jsonRequest" value="([^"]+)"/)
      const checksumMatch = html.match(/name="checksum" value="([^"]+)"/)

      expect(payloadMatch).toBeTruthy()
      expect(checksumMatch).toBeTruthy()

      // Verify payload is valid base64
      const payload = payloadMatch![1]
      expect(() => Buffer.from(payload, 'base64')).not.toThrow()

      // Verify payload contains expected data
      const decodedPayload = Buffer.from(payload, 'base64').toString('utf8')
      const payloadData = JSON.parse(decodedPayload)
      expect(payloadData.siteId).toBe('site123')
    })
  })

  describe('decrypt', () => {
    it('should decrypt valid response', () => {
      const mockIv = Buffer.from('1234567890123456')
      const mockEncrypted = Buffer.from('encrypted-data')
      const encryptedResponse = `${mockIv.toString('base64')},${mockEncrypted.toString('base64')}`

      // Mock the decryption to return valid JSON
      const expectedResponse: CheckoutResponse = {
        orderId: 12345,
        transactionId: 67890,
        status: 'complete-ok',
        amount: 10000,
        currency: 'USD',
      }

      mockPlatform.buffer.concat = vi.fn(() =>
        Buffer.from(JSON.stringify(expectedResponse)),
      )

      const result = checkoutResource.decrypt(encryptedResponse)

      expect(result).toEqual(expectedResponse)
      expect(mockPlatform.crypto.createDecipherAes256Cbc).toHaveBeenCalledWith(
        'test-api-key-32-chars-padding!!!',
        expect.any(Uint8Array),
      )
    })

    it('should handle response with additional fields', () => {
      const mockIv = Buffer.from('1234567890123456')
      const mockEncrypted = Buffer.from('encrypted-data')
      const encryptedResponse = `${mockIv.toString('base64')},${mockEncrypted.toString('base64')}`

      const expectedResponse: CheckoutResponse = {
        orderId: 12345,
        transactionId: 67890,
        status: 'complete-ok',
        amount: 10000,
        currency: 'USD',
        customField: 'custom-value',
        metadata: { key: 'value' },
      }

      mockPlatform.buffer.concat = vi.fn(() =>
        Buffer.from(JSON.stringify(expectedResponse)),
      )

      const result = checkoutResource.decrypt(encryptedResponse)

      expect(result).toEqual(expectedResponse)
      expect(result.customField).toBe('custom-value')
      expect(result.metadata).toEqual({ key: 'value' })
    })

    it('should throw error for invalid format (missing comma)', () => {
      const invalidResponse = 'base64stringwithoutcomma'

      expect(() => checkoutResource.decrypt(invalidResponse))
        .toThrow('Invalid encrypted response format')
    })

    it('should throw error for empty IV', () => {
      const invalidResponse = ',somebase64data'

      expect(() => checkoutResource.decrypt(invalidResponse))
        .toThrow('Invalid encrypted response format')
    })

    it('should throw error for empty encrypted data', () => {
      const invalidResponse = 'somebase64iv,'

      expect(() => checkoutResource.decrypt(invalidResponse))
        .toThrow('Invalid encrypted response format')
    })

    it('should throw error for invalid JSON after decryption', () => {
      const mockIv = Buffer.from('1234567890123456')
      const mockEncrypted = Buffer.from('encrypted-data')
      const encryptedResponse = `${mockIv.toString('base64')},${mockEncrypted.toString('base64')}`

      mockPlatform.buffer.concat = vi.fn(() =>
        Buffer.from('invalid-json-{'),
      )

      expect(() => checkoutResource.decrypt(encryptedResponse))
        .toThrow('Failed to parse decrypted response')
    })

    it('should handle empty JSON object', () => {
      const mockIv = Buffer.from('1234567890123456')
      const mockEncrypted = Buffer.from('encrypted-data')
      const encryptedResponse = `${mockIv.toString('base64')},${mockEncrypted.toString('base64')}`

      mockPlatform.buffer.concat = vi.fn(() =>
        Buffer.from('{}'),
      )

      const result = checkoutResource.decrypt(encryptedResponse)

      expect(result).toEqual({})
    })
  })

  describe('generateChecksum', () => {
    it('should generate checksum using HMAC-SHA512', () => {
      const mockHmac = {
        update: vi.fn(),
        digest: vi.fn(() => Buffer.from('test-digest')),
      }

      mockPlatform.crypto.createHmacSha512 = vi.fn(() => mockHmac)

      // Access private method through create
      const result = checkoutResource.create({
        publicKey: 'pk_test_site123',
        cardTransactionMode: 'auth',
        backUrl: 'https://example.com',
        customer: { identifier: 'test' },
        order: {
          orderId: 'test',
          type: 'purchase',
          amount: 1000,
          currency: 'USD',
          description: 'Test',
        },
      })

      expect(mockPlatform.crypto.createHmacSha512).toHaveBeenCalledWith('test-api-key-32-chars-padding!!!')
      expect(mockHmac.update).toHaveBeenCalled()
      expect(mockHmac.digest).toHaveBeenCalled()
      expect(result.checksum).toBe('dGVzdC1kaWdlc3Q=') // base64 of 'test-digest'
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete checkout flow', () => {
      // Step 1: Create checkout
      const checkoutParams: CheckoutCreateParams = {
        publicKey: 'pk_live_production_site',
        cardTransactionMode: 'authAndCapture',
        backUrl: 'https://shop.example.com/payment/return',
        invoiceEmail: 'billing@example.com',
        saveCard: true,
        customer: {
          identifier: 'customer_12345',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+44123456789',
          country: 'GB',
          city: 'London',
          tags: ['premium', 'uk-customer'],
        },
        order: {
          orderId: 'ORD-2025-001',
          type: 'purchase',
          amount: 25000, // £250.00
          currency: 'GBP',
          description: 'Premium subscription - 1 year',
        },
      }

      const createResult = checkoutResource.create(checkoutParams)
      expect(createResult.payload).toBeTruthy()
      expect(createResult.checksum).toBeTruthy()

      // Step 2: Generate form
      const formHtml = checkoutResource.form(checkoutParams)
      expect(formHtml).toContain('<form id="checkout-form"')
      expect(formHtml).toContain('jsonRequest')
      expect(formHtml).toContain('checksum')

      // Verify the order ID is in the encoded payload
      const payloadMatch = formHtml.match(/name="jsonRequest" value="([^"]+)"/)
      expect(payloadMatch).toBeTruthy()
      const decodedPayload = Buffer.from(payloadMatch![1], 'base64').toString('utf8')
      expect(decodedPayload).toContain('ORD-2025-001')

      // Step 3: Simulate response decryption
      const mockResponse: CheckoutResponse = {
        orderId: 98765,
        transactionId: 54321,
        status: 'complete-ok',
        amount: 25000,
        currency: 'GBP',
        cardType: 'Visa',
        cardLastDigits: '1234',
        customerId: 12345,
      }

      mockPlatform.buffer.concat = vi.fn(() =>
        Buffer.from(JSON.stringify(mockResponse)),
      )

      const encryptedResponse = 'mock-iv-base64,mock-encrypted-base64'
      const decryptedResponse = checkoutResource.decrypt(encryptedResponse)

      expect(decryptedResponse.status).toBe('complete-ok')
      expect(decryptedResponse.transactionId).toBe(54321)
    })

    it('should handle recurring payment setup', () => {
      const recurringParams: CheckoutCreateParams = {
        publicKey: 'pk_test_recurring_site',
        cardTransactionMode: 'auth',
        backUrl: 'https://saas.example.com/subscription/callback',
        saveCard: true, // Important for recurring
        customer: {
          identifier: 'subscriber_789',
          email: 'subscriber@example.com',
        },
        order: {
          orderId: 'SUB-2025-001',
          type: 'recurring',
          amount: 999, // $9.99
          currency: 'USD',
          description: 'Monthly subscription',
        },
      }

      const result = checkoutResource.create(recurringParams)

      const decodedPayload = Buffer.from(result.payload, 'base64').toString('utf8')
      const payloadData = JSON.parse(decodedPayload)

      expect(payloadData.order.type).toBe('recurring')
      expect(payloadData.saveCard).toBe(true)
    })

    it('should handle credit transaction', () => {
      const creditParams: CheckoutCreateParams = {
        publicKey: 'pk_live_credit_site',
        cardTransactionMode: 'credit',
        backUrl: 'https://store.example.com/refund/complete',
        customer: {
          identifier: 'refund_customer_456',
        },
        order: {
          orderId: 'REFUND-2025-001',
          type: 'credit',
          amount: 5000, // $50.00 refund
          currency: 'USD',
          description: 'Order refund - damaged goods',
        },
      }

      const result = checkoutResource.create(creditParams)

      const decodedPayload = Buffer.from(result.payload, 'base64').toString('utf8')
      const payloadData = JSON.parse(decodedPayload)

      expect(payloadData.cardTransactionMode).toBe('credit')
      expect(payloadData.order.type).toBe('credit')
    })
  })
})

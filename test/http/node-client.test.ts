import type { HttpRequestOptions } from '../../src/http'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NodeHttpClient } from '../../src/http'

// Mock Node.js modules
vi.mock('node:https', () => ({
  request: vi.fn(),
}))

vi.mock('node:http', () => ({
  request: vi.fn(),
}))

vi.mock('node:url', () => ({
  URL: globalThis.URL,
}))

describe('nodeHttpClient', () => {
  let client: NodeHttpClient
  let mockHttpsRequest: ReturnType<typeof vi.fn>
  let mockHttpRequest: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    client = new NodeHttpClient()

    const https = await import('node:https')
    const http = await import('node:http')

    mockHttpsRequest = https.request as any
    mockHttpRequest = http.request as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('request', () => {
    let mockRequest: any
    let mockResponse: any

    beforeEach(() => {
      // Create mock request object
      mockRequest = new EventEmitter() as any
      mockRequest.write = vi.fn()
      mockRequest.end = vi.fn()
      mockRequest.destroy = vi.fn()

      // Create mock response object
      mockResponse = new PassThrough() as any
      mockResponse.statusCode = 200
      mockResponse.statusMessage = 'OK'
      mockResponse.headers = {
        'content-type': 'application/json',
        'x-custom-header': 'value',
      }

      // Setup mocks to return our mock objects
      mockHttpsRequest.mockImplementation((options, callback) => {
        // Simulate async connection
        setImmediate(() => {
          callback(mockResponse)
          // Emit data after callback
          setImmediate(() => {
            mockResponse.emit('data', '{"data":"test"}')
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })

      mockHttpRequest.mockImplementation((options, callback) => {
        setImmediate(() => {
          callback(mockResponse)
          setImmediate(() => {
            mockResponse.emit('data', '{"data":"test"}')
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })
    })

    it('should make successful HTTPS GET request', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: { Authorization: 'Bearer token' },
        timeout: 5000,
      }

      const response = await client.request(options)

      expect(mockHttpsRequest).toHaveBeenCalledWith(
        {
          hostname: 'api.example.com',
          port: 443,
          path: '/test',
          method: 'GET',
          headers: { Authorization: 'Bearer token' },
          timeout: 5000,
        },
        expect.any(Function),
      )

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.statusText).toBe('OK')
      expect(response.headers).toEqual({
        'content-type': 'application/json',
        'x-custom-header': 'value',
      })
      expect(await response.json()).toEqual({ data: 'test' })
    })

    it('should make successful HTTP request', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'http://api.example.com/test',
        headers: {},
        timeout: 5000,
      }

      mockHttpRequest.mockImplementation((options, callback) => {
        setImmediate(() => {
          callback(mockResponse)
          setImmediate(() => {
            mockResponse.emit('data', '{"success":true}')
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })

      const response = await client.request(options)

      expect(mockHttpRequest).toHaveBeenCalled()
      expect(mockHttpsRequest).not.toHaveBeenCalled()
      expect(await response.json()).toEqual({ success: true })
    })

    it('should handle custom port', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'https://api.example.com:8443/test',
        headers: {},
        timeout: 5000,
      }

      await client.request(options)

      expect(mockHttpsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          port: '8443',
        }),
        expect.any(Function),
      )
    })

    it('should handle query parameters', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'https://api.example.com/test?page=1&limit=10',
        headers: {},
        timeout: 5000,
      }

      await client.request(options)

      expect(mockHttpsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/test?page=1&limit=10',
        }),
        expect.any(Function),
      )
    })

    it('should make POST request with body', async () => {
      const options: HttpRequestOptions = {
        method: 'POST',
        url: 'https://api.example.com/test',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
        timeout: 5000,
      }

      mockHttpsRequest.mockImplementation((options, callback) => {
        setImmediate(() => {
          callback(mockResponse)
          setImmediate(() => {
            mockResponse.emit('data', '{"id":1}')
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })

      const response = await client.request(options)

      expect(mockRequest.write).toHaveBeenCalledWith(JSON.stringify({ name: 'test' }))
      expect(mockRequest.end).toHaveBeenCalled()
      expect(await response.json()).toEqual({ id: 1 })
    })

    it('should handle error responses', async () => {
      mockResponse.statusCode = 404
      mockResponse.statusMessage = 'Not Found'

      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'https://api.example.com/notfound',
        headers: {},
        timeout: 5000,
      }

      mockHttpsRequest.mockImplementation((options, callback) => {
        setImmediate(() => {
          callback(mockResponse)
          setImmediate(() => {
            mockResponse.emit('data', '{"error":"Not found"}')
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })

      const response = await client.request(options)

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
      expect(response.statusText).toBe('Not Found')
    })

    it('should handle network errors', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        timeout: 5000,
      }

      mockHttpsRequest.mockImplementation((_options, _callback) => {
        const req = new EventEmitter() as any
        req.write = vi.fn()
        req.end = vi.fn()
        req.destroy = vi.fn()

        setImmediate(() => {
          req.emit('error', new Error('Network error'))
        })

        return req
      })

      await expect(client.request(options)).rejects.toThrow('Network error')
    })

    it('should handle timeout', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        timeout: 100,
      }

      mockHttpsRequest.mockImplementation((_options, _callback) => {
        const req = new EventEmitter() as any
        req.write = vi.fn()
        req.end = vi.fn()
        req.destroy = vi.fn()

        setImmediate(() => {
          req.emit('timeout')
        })

        return req
      })

      await expect(client.request(options)).rejects.toThrow('Request timeout')
    })

    it('should handle empty response', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        timeout: 5000,
      }

      mockHttpsRequest.mockImplementation((options, callback) => {
        setImmediate(() => {
          callback(mockResponse)
          setImmediate(() => {
            // No data emitted, just end
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })

      const response = await client.request(options)

      expect(await response.text()).toBe('')
      await expect(response.json()).rejects.toThrow() // JSON.parse('') throws
    })

    it('should handle response in chunks', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        timeout: 5000,
      }

      mockHttpsRequest.mockImplementation((options, callback) => {
        setImmediate(() => {
          callback(mockResponse)
          setImmediate(() => {
            // Emit data in multiple chunks
            mockResponse.emit('data', '{"name":')
            mockResponse.emit('data', '"John",')
            mockResponse.emit('data', '"age":30}')
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })

      const response = await client.request(options)

      expect(await response.json()).toEqual({ name: 'John', age: 30 })
    })

    it('should handle missing status code', async () => {
      mockResponse.statusCode = undefined

      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        timeout: 5000,
      }

      mockHttpsRequest.mockImplementation((options, callback) => {
        setImmediate(() => {
          callback(mockResponse)
          setImmediate(() => {
            mockResponse.emit('data', '{}')
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })

      const response = await client.request(options)

      expect(response.status).toBe(0)
      expect(response.ok).toBe(false)
    })

    it('should handle PUT request with body', async () => {
      const options: HttpRequestOptions = {
        method: 'PUT',
        url: 'https://api.example.com/test/1',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'updated' }),
        timeout: 5000,
      }

      mockHttpsRequest.mockImplementation((options, callback) => {
        setImmediate(() => {
          callback(mockResponse)
          setImmediate(() => {
            mockResponse.emit('data', '{"success":true}')
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })

      await client.request(options)

      expect(mockHttpsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
        }),
        expect.any(Function),
      )
      expect(mockRequest.write).toHaveBeenCalledWith(JSON.stringify({ name: 'updated' }))
    })

    it('should handle DELETE request', async () => {
      const options: HttpRequestOptions = {
        method: 'DELETE',
        url: 'https://api.example.com/test/1',
        headers: {},
        timeout: 5000,
      }

      mockResponse.statusCode = 204

      mockHttpsRequest.mockImplementation((options, callback) => {
        setImmediate(() => {
          callback(mockResponse)
          setImmediate(() => {
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })

      const response = await client.request(options)

      expect(response.status).toBe(204)
      expect(response.ok).toBe(true)
    })

    it('should provide text method', async () => {
      const options: HttpRequestOptions = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        timeout: 5000,
      }

      mockHttpsRequest.mockImplementation((options, callback) => {
        setImmediate(() => {
          callback(mockResponse)
          setImmediate(() => {
            mockResponse.emit('data', 'Plain text response')
            mockResponse.emit('end')
          })
        })
        return mockRequest
      })

      const response = await client.request(options)
      const text = await response.text()

      expect(text).toBe('Plain text response')
    })

    it('should handle 2xx status codes as success', async () => {
      const testCases = [200, 201, 202, 203, 204, 299]

      for (const statusCode of testCases) {
        mockResponse.statusCode = statusCode

        const options: HttpRequestOptions = {
          method: 'GET',
          url: 'https://api.example.com/test',
          headers: {},
          timeout: 5000,
        }

        mockHttpsRequest.mockImplementation((options, callback) => {
          setImmediate(() => {
            callback(mockResponse)
            setImmediate(() => {
              mockResponse.emit('data', '{}')
              mockResponse.emit('end')
            })
          })
          return mockRequest
        })

        const response = await client.request(options)

        expect(response.ok).toBe(true)
        expect(response.status).toBe(statusCode)
      }
    })

    it('should handle non-2xx status codes as error', async () => {
      const testCases = [100, 199, 300, 301, 400, 401, 403, 404, 500, 502]

      for (const statusCode of testCases) {
        mockResponse.statusCode = statusCode

        const options: HttpRequestOptions = {
          method: 'GET',
          url: 'https://api.example.com/test',
          headers: {},
          timeout: 5000,
        }

        mockHttpsRequest.mockImplementation((options, callback) => {
          setImmediate(() => {
            callback(mockResponse)
            setImmediate(() => {
              mockResponse.emit('data', '{}')
              mockResponse.emit('end')
            })
          })
          return mockRequest
        })

        const response = await client.request(options)

        expect(response.ok).toBe(false)
        expect(response.status).toBe(statusCode)
      }
    })
  })
})

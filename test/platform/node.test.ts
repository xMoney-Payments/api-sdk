import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NodeBuffer, NodeCrypto, nodePlatformProvider } from '../../src/platform/node'

vi.mock('node:crypto')

describe('nodeCrypto', () => {
  let nodeCrypto: NodeCrypto
  let mockCrypto: typeof crypto

  beforeEach(() => {
    nodeCrypto = new NodeCrypto()
    mockCrypto = crypto as any
  })

  describe('createHmacSha512', () => {
    it('should create HMAC-SHA512 instance', () => {
      const mockHmac = {
        update: vi.fn(),
        digest: vi.fn().mockReturnValue(Buffer.from('digest')),
      }

      mockCrypto.createHmac = vi.fn().mockReturnValue(mockHmac)

      const hmac = nodeCrypto.createHmacSha512('secret-key')

      expect(mockCrypto.createHmac).toHaveBeenCalledWith('sha512', 'secret-key')

      // Test update
      hmac.update('data')
      expect(mockHmac.update).toHaveBeenCalledWith('data')

      // Test digest
      const result = hmac.digest()
      expect(mockHmac.digest).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Buffer)
      expect(result.toString()).toBe('digest')
    })

    it('should handle multiple updates', () => {
      const mockHmac = {
        update: vi.fn(),
        digest: vi.fn().mockReturnValue(Buffer.from('final-digest')),
      }

      mockCrypto.createHmac = vi.fn().mockReturnValue(mockHmac)

      const hmac = nodeCrypto.createHmacSha512('key')

      hmac.update('part1')
      hmac.update('part2')
      hmac.update('part3')

      expect(mockHmac.update).toHaveBeenCalledTimes(3)
      expect(mockHmac.update).toHaveBeenCalledWith('part1')
      expect(mockHmac.update).toHaveBeenCalledWith('part2')
      expect(mockHmac.update).toHaveBeenCalledWith('part3')
    })
  })

  describe('createDecipherAes256Cbc', () => {
    it('should create AES-256-CBC decipher instance', () => {
      const mockDecipher = {
        update: vi.fn().mockReturnValue(Buffer.from('decrypted-update')),
        final: vi.fn().mockReturnValue(Buffer.from('decrypted-final')),
      }

      mockCrypto.createDecipheriv = vi.fn().mockReturnValue(mockDecipher)

      const iv = new Uint8Array(16)
      const decipher = nodeCrypto.createDecipherAes256Cbc('32-byte-key-goes-here-padding!!', iv)

      expect(mockCrypto.createDecipheriv).toHaveBeenCalledWith(
        'aes-256-cbc',
        '32-byte-key-goes-here-padding!!',
        Buffer.from(iv),
      )

      // Test update
      const encrypted = new Uint8Array([1, 2, 3, 4])
      const updateResult = decipher.update(encrypted)
      expect(mockDecipher.update).toHaveBeenCalledWith(Buffer.from(encrypted))
      expect(updateResult).toBeInstanceOf(Buffer)
      expect(updateResult.toString()).toBe('decrypted-update')

      // Test final
      const finalResult = decipher.final()
      expect(mockDecipher.final).toHaveBeenCalled()
      expect(finalResult).toBeInstanceOf(Buffer)
      expect(finalResult.toString()).toBe('decrypted-final')
    })
  })
})

describe('nodeBuffer', () => {
  let nodeBuffer: NodeBuffer

  beforeEach(() => {
    nodeBuffer = new NodeBuffer()
  })

  describe('from', () => {
    it('should create buffer from string with UTF-8 encoding', () => {
      const result = nodeBuffer.from('hello world', 'utf8')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Buffer.from(result).toString()).toBe('hello world')
    })

    it('should create buffer from string with base64 encoding', () => {
      const base64 = 'aGVsbG8gd29ybGQ=' // "hello world" in base64
      const result = nodeBuffer.from(base64, 'base64')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Buffer.from(result).toString()).toBe('hello world')
    })

    it('should create buffer from string without encoding (default UTF-8)', () => {
      const result = nodeBuffer.from('test')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Buffer.from(result).toString()).toBe('test')
    })

    it('should create buffer from ArrayBuffer', () => {
      const arrayBuffer = new ArrayBuffer(4)
      const view = new Uint8Array(arrayBuffer)
      view[0] = 65 // 'A'
      view[1] = 66 // 'B'
      view[2] = 67 // 'C'
      view[3] = 68 // 'D'

      const result = nodeBuffer.from(arrayBuffer)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Buffer.from(result).toString()).toBe('ABCD')
    })

    it('should create buffer from Uint8Array', () => {
      const uint8Array = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = nodeBuffer.from(uint8Array)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Buffer.from(result).toString()).toBe('Hello')
    })
  })

  describe('alloc', () => {
    it('should allocate buffer with specified size', () => {
      const result = nodeBuffer.alloc(10)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(10)
      expect(Array.from(result).every(byte => byte === 0)).toBe(true)
    })

    it('should allocate buffer with fill value', () => {
      const result = nodeBuffer.alloc(5, 'A')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(5)
      expect(Buffer.from(result).toString()).toBe('AAAAA')
    })

    it('should handle multi-byte fill values', () => {
      const result = nodeBuffer.alloc(6, 'AB')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(6)
      expect(Buffer.from(result).toString()).toBe('ABABAB')
    })
  })

  describe('byteLength', () => {
    it('should return byte length of ASCII string', () => {
      expect(nodeBuffer.byteLength('hello')).toBe(5)
    })

    it('should return byte length of UTF-8 string with multi-byte characters', () => {
      expect(nodeBuffer.byteLength('🌟')).toBe(4) // Emoji is 4 bytes in UTF-8
      expect(nodeBuffer.byteLength('你好')).toBe(6) // Chinese characters are 3 bytes each
    })

    it('should return 0 for empty string', () => {
      expect(nodeBuffer.byteLength('')).toBe(0)
    })
  })

  describe('concat', () => {
    it('should concatenate multiple Uint8Arrays', () => {
      const arr1 = new Uint8Array([1, 2, 3])
      const arr2 = new Uint8Array([4, 5])
      const arr3 = new Uint8Array([6, 7, 8, 9])

      const result = nodeBuffer.concat([arr1, arr2, arr3])
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('should handle empty arrays', () => {
      const result = nodeBuffer.concat([])
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(0)
    })

    it('should handle single array', () => {
      const arr = new Uint8Array([1, 2, 3])
      const result = nodeBuffer.concat([arr])
      expect(Array.from(result)).toEqual([1, 2, 3])
    })
  })

  describe('toString', () => {
    it('should convert buffer to UTF-8 string', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = nodeBuffer.toString(buffer, 'utf8')
      expect(result).toBe('Hello')
    })

    it('should convert buffer to base64 string', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = nodeBuffer.toString(buffer, 'base64')
      expect(result).toBe('SGVsbG8=')
    })

    it('should handle empty buffer', () => {
      const buffer = new Uint8Array([])
      expect(nodeBuffer.toString(buffer, 'utf8')).toBe('')
      expect(nodeBuffer.toString(buffer, 'base64')).toBe('')
    })
  })
})

describe('nodePlatformProvider', () => {
  it('should export platform provider with crypto and buffer', () => {
    expect(nodePlatformProvider).toBeDefined()
    expect(nodePlatformProvider.crypto).toBeInstanceOf(NodeCrypto)
    expect(nodePlatformProvider.buffer).toBeInstanceOf(NodeBuffer)
  })
})

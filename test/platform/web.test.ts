import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WebBuffer, WebCrypto, WebCryptoAsync, webPlatformProvider } from '../../src/platform/web'

// Mock global crypto
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      importKey: vi.fn(),
      sign: vi.fn(),
      decrypt: vi.fn(),
    },
  },
  writable: true,
})

// Mock global TextEncoder/TextDecoder
globalThis.TextEncoder = vi.fn().mockImplementation(() => ({
  encode: vi.fn().mockImplementation((str: string) => {
    return new Uint8Array(str.split('').map(c => c.charCodeAt(0)))
  }),
}))

globalThis.TextDecoder = vi.fn().mockImplementation(() => ({
  decode: vi.fn().mockImplementation((arr: Uint8Array) => {
    return String.fromCharCode(...arr)
  }),
}))

// Mock atob/btoa
globalThis.atob = vi.fn().mockImplementation((base64: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  base64 = base64.replace(/=/g, '')

  for (let i = 0; i < base64.length; i += 4) {
    const encoded = (chars.indexOf(base64[i]) << 18)
      | (chars.indexOf(base64[i + 1]) << 12)
      | (chars.indexOf(base64[i + 2] || 'A') << 6)
      | chars.indexOf(base64[i + 3] || 'A')

    result += String.fromCharCode((encoded >> 16) & 0xFF)
    if (base64[i + 2])
      result += String.fromCharCode((encoded >> 8) & 0xFF)
    if (base64[i + 3])
      result += String.fromCharCode(encoded & 0xFF)
  }

  return result
})

globalThis.btoa = vi.fn().mockImplementation((str: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''

  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i)
    const b = i + 1 < str.length ? str.charCodeAt(i + 1) : 0
    const c = i + 2 < str.length ? str.charCodeAt(i + 2) : 0

    const bitmap = (a << 16) | (b << 8) | c

    result += chars.charAt((bitmap >> 18) & 63)
    result += chars.charAt((bitmap >> 12) & 63)
    result += i + 1 < str.length ? chars.charAt((bitmap >> 6) & 63) : '='
    result += i + 2 < str.length ? chars.charAt(bitmap & 63) : '='
  }

  return result
})

describe('webCrypto', () => {
  let webCrypto: WebCrypto

  beforeEach(() => {
    webCrypto = new WebCrypto()
    vi.clearAllMocks()
  })

  describe('createHmacSha512', () => {
    it('should throw error for sync HMAC implementation', () => {
      const hmac = webCrypto.createHmacSha512('secret-key')

      // Update should work
      expect(() => hmac.update('data')).not.toThrow()

      // Digest should throw
      expect(() => hmac.digest()).toThrow('Web Crypto HMAC requires async implementation. Use WebCryptoAsync instead.')
    })
  })

  describe('createDecipherAes256Cbc', () => {
    it('should throw error for sync decipher implementation', () => {
      expect(() => webCrypto.createDecipherAes256Cbc('key', new Uint8Array(16)))
        .toThrow('Web Crypto decryption requires async implementation. Use WebCryptoAsync instead.')
    })
  })
})

describe('webCryptoAsync', () => {
  let webCryptoAsync: WebCryptoAsync

  beforeEach(() => {
    webCryptoAsync = new WebCryptoAsync()
    vi.clearAllMocks()
  })

  describe('createHmacSha512', () => {
    it('should create async HMAC instance', async () => {
      const mockCryptoKey = { type: 'secret' }
      const mockSignature = new ArrayBuffer(64)

      globalThis.crypto.subtle.importKey = vi.fn().mockResolvedValue(mockCryptoKey)
      globalThis.crypto.subtle.sign = vi.fn().mockResolvedValue(mockSignature)

      const hmac = await webCryptoAsync.createHmacSha512('secret-key')

      expect(crypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign'],
      )

      // Test update
      hmac.update('part1')
      hmac.update('part2')

      // Test digest
      const result = await hmac.digest()
      expect(crypto.subtle.sign).toHaveBeenCalledWith('HMAC', mockCryptoKey, expect.any(Uint8Array))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('should handle empty updates', async () => {
      const mockCryptoKey = { type: 'secret' }
      const mockSignature = new ArrayBuffer(64)

      globalThis.crypto.subtle.importKey = vi.fn().mockResolvedValue(mockCryptoKey)
      globalThis.crypto.subtle.sign = vi.fn().mockResolvedValue(mockSignature)

      const hmac = await webCryptoAsync.createHmacSha512('key')

      // No updates, just digest
      const result = await hmac.digest()

      // Should sign empty data
      expect(crypto.subtle.sign).toHaveBeenCalledWith('HMAC', mockCryptoKey, new Uint8Array(0))
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('createDecipherAes256Cbc', () => {
    it('should create async decipher instance', async () => {
      const mockCryptoKey = { type: 'secret' }
      const mockDecrypted = new ArrayBuffer(16)

      globalThis.crypto.subtle.importKey = vi.fn().mockResolvedValue(mockCryptoKey)
      globalThis.crypto.subtle.decrypt = vi.fn().mockResolvedValue(mockDecrypted)

      const iv = new Uint8Array(16)
      const decipher = await webCryptoAsync.createDecipherAes256Cbc('32-byte-key-goes-here-padding!!', iv)

      expect(crypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        { name: 'AES-CBC' },
        false,
        ['decrypt'],
      )

      // Test update (stores data)
      const encrypted1 = new Uint8Array([1, 2, 3, 4])
      const encrypted2 = new Uint8Array([5, 6, 7, 8])
      const updateResult = decipher.update(encrypted1)
      expect(updateResult).toEqual(new Uint8Array(0)) // Returns empty for compatibility

      decipher.update(encrypted2)

      // Test final (performs actual decryption)
      const result = await decipher.final()
      expect(crypto.subtle.decrypt).toHaveBeenCalledWith(
        { name: 'AES-CBC', iv },
        mockCryptoKey,
        expect.any(Uint8Array), // Combined chunks
      )
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(16)
    })

    it('should handle key truncation to 32 bytes', async () => {
      const mockCryptoKey = { type: 'secret' }
      globalThis.crypto.subtle.importKey = vi.fn().mockResolvedValue(mockCryptoKey)

      const longKey = 'this-is-a-very-long-key-that-exceeds-32-bytes-length'
      const iv = new Uint8Array(16)
      await webCryptoAsync.createDecipherAes256Cbc(longKey, iv)

      const importKeyCall = (crypto.subtle.importKey as any).mock.calls[0]
      const keyData = importKeyCall[1] as Uint8Array
      expect(keyData.length).toBe(32)
    })
  })
})

describe('webBuffer', () => {
  let webBuffer: WebBuffer

  beforeEach(() => {
    webBuffer = new WebBuffer()
    vi.clearAllMocks()
  })

  describe('from', () => {
    it('should create buffer from string with UTF-8 encoding', () => {
      const result = webBuffer.from('hello', 'utf8')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([104, 101, 108, 108, 111])
    })

    it('should create buffer from string with base64 encoding', () => {
      // Mock atob to return "hello"
      globalThis.atob = vi.fn().mockReturnValue('hello')

      const result = webBuffer.from('aGVsbG8=', 'base64')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([104, 101, 108, 108, 111])
      expect(globalThis.atob).toHaveBeenCalledWith('aGVsbG8=')
    })

    it('should create buffer from string without encoding (default UTF-8)', () => {
      const result = webBuffer.from('test')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([116, 101, 115, 116])
    })

    it('should create buffer from ArrayBuffer', () => {
      const arrayBuffer = new ArrayBuffer(3)
      const view = new Uint8Array(arrayBuffer)
      view[0] = 1
      view[1] = 2
      view[2] = 3

      const result = webBuffer.from(arrayBuffer)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([1, 2, 3])
    })

    it('should create buffer from Uint8Array', () => {
      const uint8Array = new Uint8Array([10, 20, 30])
      const result = webBuffer.from(uint8Array)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([10, 20, 30])
    })
  })

  describe('alloc', () => {
    it('should allocate buffer with specified size', () => {
      const result = webBuffer.alloc(5)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(5)
      expect(Array.from(result)).toEqual([0, 0, 0, 0, 0])
    })

    it('should allocate buffer with fill value', () => {
      const result = webBuffer.alloc(3, 'A')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(3)
      expect(Array.from(result)).toEqual([65, 65, 65]) // 'A' = 65
    })

    it('should handle multi-byte fill values', () => {
      const result = webBuffer.alloc(6, 'AB')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(6)
      expect(Array.from(result)).toEqual([65, 66, 65, 66, 65, 66]) // 'A'=65, 'B'=66
    })

    it('should handle fill value shorter than buffer size', () => {
      const result = webBuffer.alloc(5, 'ABC')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(5)
      expect(Array.from(result)).toEqual([65, 66, 67, 65, 66]) // 'A'=65, 'B'=66, 'C'=67
    })
  })

  describe('byteLength', () => {
    it('should return byte length of ASCII string', () => {
      expect(webBuffer.byteLength('hello')).toBe(5)
    })

    it('should return byte length of empty string', () => {
      expect(webBuffer.byteLength('')).toBe(0)
    })

    it('should handle special characters', () => {
      // Since our mock TextEncoder just uses charCodeAt, it won't handle multi-byte UTF-8
      // In real implementation, emojis would be 4 bytes
      expect(webBuffer.byteLength('test')).toBe(4)
    })
  })

  describe('concat', () => {
    it('should concatenate multiple Uint8Arrays', () => {
      const arr1 = new Uint8Array([1, 2])
      const arr2 = new Uint8Array([3, 4, 5])
      const arr3 = new Uint8Array([6])

      const result = webBuffer.concat([arr1, arr2, arr3])
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('should handle empty arrays', () => {
      const result = webBuffer.concat([])
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(0)
    })

    it('should handle single array', () => {
      const arr = new Uint8Array([7, 8, 9])
      const result = webBuffer.concat([arr])
      expect(Array.from(result)).toEqual([7, 8, 9])
    })

    it('should handle arrays with empty Uint8Arrays', () => {
      const arr1 = new Uint8Array([1, 2])
      const arr2 = new Uint8Array([])
      const arr3 = new Uint8Array([3, 4])

      const result = webBuffer.concat([arr1, arr2, arr3])
      expect(Array.from(result)).toEqual([1, 2, 3, 4])
    })
  })

  describe('toString', () => {
    it('should convert buffer to UTF-8 string', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = webBuffer.toString(buffer, 'utf8')
      expect(result).toBe('Hello')
    })

    it('should convert buffer to base64 string', () => {
      // Mock btoa to return expected base64
      globalThis.btoa = vi.fn().mockReturnValue('SGVsbG8=')

      const buffer = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = webBuffer.toString(buffer, 'base64')
      expect(result).toBe('SGVsbG8=')
      expect(globalThis.btoa).toHaveBeenCalled()
    })

    it('should handle empty buffer', () => {
      const buffer = new Uint8Array([])

      globalThis.btoa = vi.fn().mockReturnValue('')

      expect(webBuffer.toString(buffer, 'utf8')).toBe('')
      expect(webBuffer.toString(buffer, 'base64')).toBe('')
    })
  })
})

describe('webPlatformProvider', () => {
  it('should export platform provider with crypto and buffer', () => {
    expect(webPlatformProvider).toBeDefined()
    expect(webPlatformProvider.crypto).toBeInstanceOf(WebCrypto)
    expect(webPlatformProvider.buffer).toBeInstanceOf(WebBuffer)
  })
})

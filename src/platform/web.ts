import type { DecipherInterface, HmacInterface, PlatformBuffer, PlatformCrypto, PlatformProvider } from './types'

/**
 * Web implementation using Web Crypto API
 */
export class WebCrypto implements PlatformCrypto {
  createHmacSha512(key: string): HmacInterface {
    const encoder = new TextEncoder()
    const _keyData = encoder.encode(key)
    let _cryptoKey: any
    const data: Uint8Array[] = []

    return {
      update: (input: string) => {
        data.push(encoder.encode(input))
      },
      digest: () => {
        // This is synchronous for simplicity, but in real usage should be async
        const _combined = this.concatArrays(data)

        throw new Error('Web Crypto HMAC requires async implementation. Use WebCryptoAsync instead.')
      },
    }
  }

  createDecipherAes256Cbc(_key: string, _iv: Uint8Array): DecipherInterface {
    throw new Error('Web Crypto decryption requires async implementation. Use WebCryptoAsync instead.')
  }

  private concatArrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const arr of arrays) {
      result.set(arr, offset)
      offset += arr.length
    }
    return result
  }
}

/**
 * Async Web Crypto implementation (recommended for browser)
 */
export class WebCryptoAsync {
  async createHmacSha512(key: string): Promise<HmacAsyncInterface> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(key)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign'],
    )

    const data: Uint8Array[] = []

    return {
      update: (input: string) => {
        data.push(encoder.encode(input))
      },
      digest: async () => {
        const combined = concatUint8Arrays(data)
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, combined)
        return new Uint8Array(signature)
      },
    }
  }

  async createDecipherAes256Cbc(key: string, iv: Uint8Array): Promise<DecipherAsyncInterface> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(key).slice(0, 32) // Ensure 256-bit key

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-CBC' },
      false,
      ['decrypt'],
    )

    const chunks: Uint8Array[] = []

    return {
      update: (data: Uint8Array) => {
        chunks.push(data)
        return new Uint8Array(0) // Return empty for compatibility
      },
      final: async () => {
        const combined = concatUint8Arrays(chunks)
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-CBC', iv },
          cryptoKey,
          combined,
        )
        return new Uint8Array(decrypted)
      },
    }
  }
}

export interface HmacAsyncInterface {
  update: (data: string) => void
  digest: () => Promise<Uint8Array>
}

export interface DecipherAsyncInterface {
  update: (data: Uint8Array) => Uint8Array
  final: () => Promise<Uint8Array>
}

export class WebBuffer implements PlatformBuffer {
  from(input: string | ArrayBuffer | Uint8Array, encoding?: 'base64' | 'utf8'): Uint8Array {
    if (typeof input === 'string') {
      if (encoding === 'base64') {
        return this.base64ToUint8Array(input)
      }
      return new TextEncoder().encode(input)
    }

    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input)
    }

    return new Uint8Array(input)
  }

  alloc(size: number, fill?: string): Uint8Array {
    const buffer = new Uint8Array(size)
    if (fill) {
      const encoder = new TextEncoder()
      const fillBytes = encoder.encode(fill)
      for (let i = 0; i < size; i++) {
        buffer[i] = fillBytes[i % fillBytes.length]
      }
    }
    return buffer
  }

  byteLength(string: string): number {
    return new TextEncoder().encode(string).length
  }

  concat(arrays: Uint8Array[]): Uint8Array {
    return concatUint8Arrays(arrays)
  }

  toString(buffer: Uint8Array, encoding: 'base64' | 'utf8'): string {
    if (encoding === 'base64') {
      return this.uint8ArrayToBase64(buffer)
    }
    return new TextDecoder().decode(buffer)
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}

/**
 * Helper function to concatenate Uint8Arrays
 */
function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

// Export the platform provider
export const webPlatformProvider: PlatformProvider = {
  crypto: new WebCrypto(),
  buffer: new WebBuffer(),
}

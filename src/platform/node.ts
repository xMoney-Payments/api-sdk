import type { DecipherInterface, HmacInterface, PlatformBuffer, PlatformCrypto } from './types'
import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'

export class NodeCrypto implements PlatformCrypto {
  private crypto: typeof import('crypto')

  constructor() {
    // Dynamic import to avoid issues in browser environments
    this.crypto = crypto
  }

  createHmacSha512(key: string): HmacInterface {
    const hmac = this.crypto.createHmac('sha512', key)
    return {
      update: (data: string) => { hmac.update(data) },
      digest: () => Buffer.from(hmac.digest()),
    }
  }

  createDecipherAes256Cbc(key: string, iv: Uint8Array): DecipherInterface {
    const decipher = this.crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv))
    return {
      update: (data: Uint8Array) => Buffer.from(decipher.update(Buffer.from(data))),
      final: () => Buffer.from(decipher.final()),
    }
  }
}

export class NodeBuffer implements PlatformBuffer {
  from(input: string | ArrayBuffer | Uint8Array, encoding?: 'base64' | 'utf8'): Uint8Array {
    if (typeof input === 'string') {
      return Buffer.from(input, encoding)
    }
    return Buffer.from(input as ArrayLike<number>)
  }

  alloc(size: number, fill?: string): Uint8Array {
    return fill ? Buffer.alloc(size, fill) : Buffer.alloc(size)
  }

  byteLength(string: string): number {
    return Buffer.byteLength(string)
  }

  concat(arrays: Uint8Array[]): Uint8Array {
    return Buffer.concat(arrays.map(arr => Buffer.from(arr)))
  }

  toString(buffer: Uint8Array, encoding: 'base64' | 'utf8'): string {
    return Buffer.from(buffer).toString(encoding)
  }
}

export interface PlatformCrypto {
  createHmacSha512: (key: string) => HmacInterface
  createDecipherAes256Cbc: (key: string, iv: Uint8Array) => DecipherInterface
}

export interface HmacInterface {
  update: (data: string) => void
  digest: () => Uint8Array
}

export interface DecipherInterface {
  update: (data: Uint8Array) => Uint8Array
  final: () => Uint8Array
}

export interface PlatformBuffer {
  from: ((input: string, encoding: 'base64' | 'utf8') => Uint8Array) & ((input: ArrayBuffer | Uint8Array) => Uint8Array)
  alloc: (size: number, fill?: string) => Uint8Array
  byteLength: (string: string) => number
  concat: (arrays: Uint8Array[]) => Uint8Array
  toString: (buffer: Uint8Array, encoding: 'base64' | 'utf8') => string
}

export interface PlatformProvider {
  crypto: PlatformCrypto
  buffer: PlatformBuffer
}

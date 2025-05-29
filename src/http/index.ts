import type { HttpClient } from './types'
import { FetchHttpClient } from './fetch-client'
import { NodeHttpClient } from './node-client'

export function createDefaultHttpClient(): HttpClient {
  // Check if we're in Node.js
  if (typeof globalThis.fetch === 'undefined') {
    // In Node.js without fetch
    return new NodeHttpClient()
  }
  else {
    // In browser or Node.js with fetch
    return new FetchHttpClient()
  }
}

export { FetchHttpClient, NodeHttpClient }
export type * from './types'

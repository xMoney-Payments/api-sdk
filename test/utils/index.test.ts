import { describe, expect, it } from 'vitest'
import { DateTransformer } from '../../src/utils'

describe('utils exports', () => {
  it('should export DateTransformer', () => {
    expect(DateTransformer).toBeDefined()
    expect(typeof DateTransformer.toApi).toBe('function')
    expect(typeof DateTransformer.fromApi).toBe('function')
  })
})

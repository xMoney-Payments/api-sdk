import { describe, expect, it } from 'vitest'
import { DateTransformer } from '../../src/utils'

describe('dateTransformer', () => {
  describe('toApi', () => {
    it('should handle null and undefined', () => {
      expect(DateTransformer.toApi(null)).toBe(null)
      expect(DateTransformer.toApi(undefined)).toBe(undefined)
    })

    it('should handle non-object values', () => {
      expect(DateTransformer.toApi('string')).toBe('string')
      expect(DateTransformer.toApi(123)).toBe(123)
      expect(DateTransformer.toApi(true)).toBe(true)
    })

    it('should transform Date objects to ISO strings with timezone', () => {
      const date = new Date('2023-01-01T12:00:00.000Z')
      const result = DateTransformer.toApi(date)
      expect(result).toBe('2023-01-01T12:00:00+00:00')
    })

    it('should transform Date properties in objects', () => {
      const date = new Date('2023-01-01T12:00:00.000Z')
      const input = {
        createdAt: date,
        name: 'test',
        updatedAt: date,
      }
      const result = DateTransformer.toApi(input)
      expect(result).toEqual({
        createdAt: '2023-01-01T12:00:00+00:00',
        name: 'test',
        updatedAt: '2023-01-01T12:00:00+00:00',
      })
    })

    it('should handle nested objects', () => {
      const date = new Date('2023-01-01T12:00:00.000Z')
      const input = {
        data: {
          createdAt: date,
          nested: {
            updatedAt: date,
          },
        },
      }
      const result = DateTransformer.toApi(input)
      expect(result).toEqual({
        data: {
          createdAt: '2023-01-01T12:00:00+00:00',
          nested: {
            updatedAt: '2023-01-01T12:00:00+00:00',
          },
        },
      })
    })

    it('should handle arrays', () => {
      const date = new Date('2023-01-01T12:00:00.000Z')
      const input = [
        { createdAt: date },
        { updatedAt: date },
      ]
      const result = DateTransformer.toApi(input)
      expect(result).toEqual([
        { createdAt: '2023-01-01T12:00:00+00:00' },
        { updatedAt: '2023-01-01T12:00:00+00:00' },
      ])
    })

    it('should handle arrays of dates', () => {
      const date1 = new Date('2023-01-01T12:00:00.000Z')
      const date2 = new Date('2023-12-31T23:59:59.000Z')
      const input = [date1, date2]
      const result = DateTransformer.toApi(input)
      expect(result).toEqual([
        '2023-01-01T12:00:00+00:00',
        '2023-12-31T23:59:59+00:00',
      ])
    })
  })

  describe('fromApi', () => {
    it('should handle null and undefined', () => {
      expect(DateTransformer.fromApi(null)).toBe(null)
      expect(DateTransformer.fromApi(undefined)).toBe(undefined)
    })

    it('should handle non-object values', () => {
      expect(DateTransformer.fromApi('string')).toBe('string')
      expect(DateTransformer.fromApi(123)).toBe(123)
      expect(DateTransformer.fromApi(true)).toBe(true)
    })

    it('should convert date strings to Date objects for known fields', () => {
      const input = {
        createdAt: '2023-01-01T12:00:00+00:00',
        updatedAt: '2023-01-01T12:00:00.000Z',
        name: 'test',
      }
      const result = DateTransformer.fromApi(input)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect((result.createdAt as unknown as Date).toISOString()).toBe('2023-01-01T12:00:00.000Z')
      expect((result.updatedAt as unknown as Date).toISOString()).toBe('2023-01-01T12:00:00.000Z')
      expect(result.name).toBe('test')
    })

    it('should handle all known date fields', () => {
      const dateString = '2023-01-01T12:00:00+00:00'
      const input = {
        createdAt: dateString,
        createdAtFrom: dateString,
        createdAtTo: dateString,
        creationDate: dateString,
        updatedAt: dateString,
        deletedAt: dateString,
        expiryDate: dateString,
        componentDate: dateString,
        cardExpiryDate: dateString,
        dueDate: dateString,
        startDate: dateString,
        endDate: dateString,
        otherField: dateString,
      }
      const result = DateTransformer.fromApi(input)

      // All known date fields should be converted
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.createdAtFrom).toBeInstanceOf(Date)
      expect(result.createdAtTo).toBeInstanceOf(Date)
      expect(result.creationDate).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.deletedAt).toBeInstanceOf(Date)
      expect(result.expiryDate).toBeInstanceOf(Date)
      expect(result.componentDate).toBeInstanceOf(Date)
      expect(result.cardExpiryDate).toBeInstanceOf(Date)
      expect(result.dueDate).toBeInstanceOf(Date)
      expect(result.startDate).toBeInstanceOf(Date)
      expect(result.endDate).toBeInstanceOf(Date)

      // Unknown field should remain as string
      expect(result.otherField).toBe(dateString)
    })

    it('should not convert non-date strings', () => {
      const input = {
        createdAt: 'not-a-date',
        updatedAt: 'invalid-date',
      }
      const result = DateTransformer.fromApi(input)
      expect(result.createdAt).toBe('not-a-date')
      expect(result.updatedAt).toBe('invalid-date')
    })

    it('should not convert non-string values in date fields', () => {
      const input = {
        createdAt: 123,
        updatedAt: null,
        deletedAt: undefined,
        expiryDate: true,
      }
      const result = DateTransformer.fromApi(input)
      expect(result.createdAt).toBe(123)
      expect(result.updatedAt).toBe(null)
      expect(result.deletedAt).toBe(undefined)
      expect(result.expiryDate).toBe(true)
    })

    it('should handle nested objects', () => {
      const dateString = '2023-01-01T12:00:00+00:00'
      const input = {
        data: {
          createdAt: dateString,
          nested: {
            updatedAt: dateString,
          },
        },
      }
      const result = DateTransformer.fromApi(input)
      expect(result.data.createdAt).toBeInstanceOf(Date)
      expect(result.data.nested.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle arrays', () => {
      const dateString = '2023-01-01T12:00:00+00:00'
      const input = [
        { createdAt: dateString },
        { updatedAt: dateString },
      ]
      const result = DateTransformer.fromApi(input)
      expect(result[0].createdAt).toBeInstanceOf(Date)
      expect(result[1].updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('round-trip conversion', () => {
    it('should maintain date values through round-trip conversion', () => {
      const original = {
        createdAt: new Date('2023-01-01T12:00:00.000Z'),
        updatedAt: new Date('2023-12-31T23:59:59.000Z'),
        name: 'test',
        count: 42,
      }

      const apiFormat = DateTransformer.toApi(original)
      const restored = DateTransformer.fromApi(apiFormat)

      expect(restored.createdAt.toISOString()).toBe(original.createdAt.toISOString())
      expect(restored.updatedAt.toISOString()).toBe(original.updatedAt.toISOString())
      expect(restored.name).toBe(original.name)
      expect(restored.count).toBe(original.count)
    })
  })
})

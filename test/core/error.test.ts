import type { ApiError } from '../../src/types'
import { describe, expect, it } from 'vitest'
import { XMoneyError } from '../../src/core'

describe('xMoneyError', () => {
  it('should create error with message only', () => {
    const error = new XMoneyError('Something went wrong')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(XMoneyError)
    expect(error.message).toBe('Something went wrong')
    expect(error.name).toBe('XMoneyError')
    expect(error.details).toEqual({})
  })

  it('should create error with details', () => {
    const details = {
      statusCode: 400,
      code: 1001,
      errors: [
        { type: 'Validation', field: 'email', message: 'Invalid email format' },
      ] as ApiError[],
    }

    const error = new XMoneyError('Validation failed', details)

    expect(error.message).toBe('Validation failed')
    expect(error.details).toEqual(details)
  })

  describe('isValidationError', () => {
    it('should return true when validation errors exist', () => {
      const error = new XMoneyError('Validation failed', {
        errors: [
          { type: 'Validation', field: 'email', message: 'Invalid email', code: 1001 },
          { type: 'Validation', field: 'name', message: 'Name is required', code: 1002 },
        ],
      })

      expect(error.isValidationError).toBe(true)
    })

    it('should return false when no validation errors exist', () => {
      const error = new XMoneyError('Server error', {
        errors: [
          { type: 'Exception', message: 'Internal server error', code: 5001 },
        ],
      })

      expect(error.isValidationError).toBe(false)
    })

    it('should return false when no errors exist', () => {
      const error = new XMoneyError('Error without details')
      expect(error.isValidationError).toBe(false)
    })

    it('should return false when errors array is empty', () => {
      const error = new XMoneyError('Error with empty errors', {
        errors: [],
      })
      expect(error.isValidationError).toBe(false)
    })
  })

  describe('validationErrors', () => {
    it('should return validation errors as key-value pairs', () => {
      const error = new XMoneyError('Validation failed', {
        errors: [
          { type: 'Validation', field: 'email', message: 'Invalid email format', code: 1001 },
          { type: 'Validation', field: 'password', message: 'Password too short', code: 1002 },
          { type: 'Validation', field: 'name', message: 'Name is required', code: 1003 },
        ],
      })

      expect(error.validationErrors).toEqual({
        email: 'Invalid email format',
        password: 'Password too short',
        name: 'Name is required',
      })
    })

    it('should handle validation errors without field', () => {
      const error = new XMoneyError('Validation failed', {
        errors: [
          { type: 'Validation', message: 'General validation error', code: 1004 },
          { type: 'Validation', field: 'email', message: 'Invalid email', code: 1005 },
        ],
      })

      expect(error.validationErrors).toEqual({
        email: 'Invalid email',
      })
    })

    it('should return empty object when no validation errors', () => {
      const error = new XMoneyError('Error', {
        errors: [
          { type: 'Exception', message: 'Server error', code: 5001 },
        ],
      })

      expect(error.validationErrors).toEqual({})
    })

    it('should return empty object when no errors', () => {
      const error = new XMoneyError('Error without details')
      expect(error.validationErrors).toEqual({})
    })

    it('should handle multiple errors for the same field (last one wins)', () => {
      const error = new XMoneyError('Validation failed', {
        errors: [
          { type: 'Validation', field: 'email', message: 'Invalid format', code: 1001 },
          { type: 'Validation', field: 'email', message: 'Email already exists', code: 1002 },
        ],
      })

      expect(error.validationErrors).toEqual({
        email: 'Email already exists',
      })
    })
  })

  it('should have proper stack trace', () => {
    const error = new XMoneyError('Test error')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('XMoneyError: Test error')
  })

  it('should preserve all detail properties', () => {
    const details = {
      statusCode: 403,
      code: 2001,
      errors: [
        { type: 'Exception', message: 'Forbidden', code: 2001 },
      ] as ApiError[],
    }

    const error = new XMoneyError('Forbidden', details)

    expect(error.details.statusCode).toBe(403)
    expect(error.details.code).toBe(2001)
    expect(error.details.errors).toEqual(details.errors)
  })
})

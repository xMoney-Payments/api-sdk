import type { ApiError } from '../types'

/**
 * Custom error class for XMoney API errors
 *
 * Provides detailed error information including:
 * - HTTP status code
 * - API error code
 * - Validation errors with field-level details
 *
 * @example
 * ```typescript
 * try {
 *   await xMoney.customers.create({ email: 'invalid' })
 * } catch (error) {
 *   if (error instanceof XMoneyError) {
 *     console.log('Status:', error.details.statusCode)
 *     if (error.isValidationError) {
 *       console.log('Validation errors:', error.validationErrors)
 *     }
 *   }
 * }
 * ```
 */
export class XMoneyError extends Error {
  /**
   * Create a new XMoneyError
   * @param message - Error message
   * @param details - Additional error details from the API response
   * @param details.statusCode - HTTP status code of the failed request
   * @param details.code - API-specific error code
   * @param details.errors - Array of detailed error information
   */
  constructor(
    message: string,
    public readonly details: {
      /**
       * HTTP status code of the failed request
       */
      statusCode?: number
      /**
       * API-specific error code
       */
      code?: number
      /**
       * Array of detailed error information
       */
      errors?: ApiError[]
    } = {},
  ) {
    super(message)
    this.name = 'XMoneyError'
    Error.captureStackTrace(this, XMoneyError)
  }

  /**
   * Check if this error contains validation errors
   * @returns True if any validation errors are present
   */
  get isValidationError(): boolean {
    return this.details.errors?.some(e => e.type === 'Validation') ?? false
  }

  /**
   * Get validation errors as a field-to-message mapping
   * @returns Object with field names as keys and error messages as values
   *
   * @example
   * ```typescript
   * // Returns: { email: 'Invalid email format', name: 'Name is required' }
   * ```
   */
  get validationErrors(): Record<string, string> {
    const errors: Record<string, string> = {}
    this.details.errors?.forEach((error) => {
      if (error.type === 'Validation' && error.field) {
        errors[error.field] = error.message
      }
    })
    return errors
  }
}

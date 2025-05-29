import type { ApiError } from '../types'

export class XMoneyError extends Error {
  constructor(
    message: string,
    public readonly details: {
      statusCode?: number
      code?: number
      errors?: ApiError[]
    } = {},
  ) {
    super(message)
    this.name = 'XMoneyError'
    Error.captureStackTrace(this, XMoneyError)
  }

  get isValidationError(): boolean {
    return this.details.errors?.some(e => e.type === 'Validation') ?? false
  }

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

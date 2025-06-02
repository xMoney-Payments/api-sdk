/**
 * Utility class for transforming dates between JavaScript Date objects
 * and XMoney API date string format
 *
 * Handles automatic conversion of date fields in API requests and responses
 */
export class DateTransformer {
  /**
   * Set of field names that should be treated as dates
   * @private
   */
  private static readonly DATE_FIELDS = new Set([
    'componentDate',
    'createdAt',
    'createdAtFrom',
    'createdAtTo',
    'creationDate',
    'deletedAt',
    'dueDate',
    'endDate',
    'firstBillDate',
    'isWhitelistedUntil',
    'isWhitelistedUntilFrom',
    'isWhitelistedUntilTo',
    'nextDueDate',
    'occurredAtFrom',
    'occurredAtTo',
    'startDate',
    'updatedAt',
  ])

  /**
   * Transform Date objects to ISO 8601 strings for API requests
   *
   * Converts JavaScript Date objects to the format expected by XMoney API:
   * "YYYY-MM-DDTHH:mm:ss+00:00"
   *
   * @template T - Type of the data
   * @param data - Data containing potential Date objects
   * @returns Data with Date objects converted to strings
   *
   * @example
   * ```typescript
   * const params = {
   *   createdAtFrom: new Date('2024-01-01'),
   *   customerId: 123
   * }
   * const apiParams = DateTransformer.toApi(params)
   * // Result: { createdAtFrom: '2024-01-01T00:00:00+00:00', customerId: 123 }
   * ```
   */
  static toApi<T = any>(data: T): T {
    if (data === null || data === undefined)
      return data
    if (typeof data !== 'object')
      return data

    if (Array.isArray(data)) {
      return data.map(item => this.toApi(item)) as any
    }

    // Handle Date objects
    if (data instanceof Date) {
      return (`${data.toISOString().slice(0, -5)}+00:00`) as any
    }

    // Handle regular objects
    const result: any = {}

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        // Format date as required by API
        result[key] = `${value.toISOString().slice(0, -5)}+00:00`
      }
      else if (value !== null && typeof value === 'object') {
        // Recursively transform nested objects
        result[key] = this.toApi(value)
      }
      else {
        result[key] = value
      }
    }

    return result
  }

  /**
   * Transform date strings from API responses to JavaScript Date objects
   *
   * Automatically converts known date fields from string format to Date objects
   * for easier manipulation in JavaScript
   *
   * @template T - Type of the data
   * @param data - Data from API containing date strings
   * @returns Data with date strings converted to Date objects
   *
   * @example
   * ```typescript
   * const apiResponse = {
   *   id: 123,
   *   creationDate: '2024-01-01T12:00:00+00:00'
   * }
   * const transformed = DateTransformer.fromApi(apiResponse)
   * // Result: { id: 123, creationDate: Date object }
   * ```
   */
  static fromApi<T = any>(data: T): T {
    if (data === null || data === undefined)
      return data
    if (typeof data !== 'object')
      return data

    // Handle arrays
    if (Array.isArray(data))
      return data.map(item => this.fromApi(item)) as any

    // Handle regular objects
    const result: any = {}

    for (const [key, value] of Object.entries(data)) {
      if (this.shouldConvertToDate(key, value)) {
        result[key] = new Date(value as string)
      }
      else if (value !== null && typeof value === 'object') {
        // Recursively transform nested objects
        result[key] = this.fromApi(value)
      }
      else {
        result[key] = value
      }
    }

    return result
  }

  /**
   * Check if a field should be converted to a Date object
   *
   * @param key - Field name to check
   * @param value - Field value to validate
   * @returns True if the field should be converted to Date
   * @private
   */
  private static shouldConvertToDate(key: string, value: any): boolean {
    if (!this.DATE_FIELDS.has(key))
      return false
    if (typeof value !== 'string')
      return false

    // Check if it's a valid date string
    const date = new Date(value)
    return !Number.isNaN(date.getTime())
  }
}

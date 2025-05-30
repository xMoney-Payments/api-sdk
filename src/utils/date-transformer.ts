export class DateTransformer {
  // List of fields that should be treated as dates
  private static readonly DATE_FIELDS = new Set([
    'createdAt',
    'createdAtFrom',
    'createdAtTo',
    'creationDate',
    'updatedAt',
    'deletedAt',
    'expiryDate',
    'componentDate',
    'cardExpiryDate',
    'dueDate',
    'startDate',
    'endDate',
  ])

  /**
   * Transform dates to strings for API requests
   */
  static toApi<T extends Record<string, any>>(data: T): T {
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
   * Transform strings to dates for API responses
   */
  static fromApi<T extends Record<string, any>>(data: T): T {
    if (data === null || data === undefined)
      return data
    if (typeof data !== 'object')
      return data

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.fromApi(item)) as any
    }

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
   * Check if a field should be converted to a Date
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

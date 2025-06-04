import type { PlatformProvider } from '../platform/types'
import type { XMoneyCore } from '../types'
import { XMoneyError } from '../core'

/**
 * Payment request data for hosted checkout
 */
export interface PaymentRequest {
  /**
   * Site ID extracted from public key
   */
  siteId: string
  /**
   * Card transaction mode
   * - auth: Authorization only
   * - authAndCapture: Authorize and capture immediately
   * - credit: Credit/refund transaction
   */
  cardTransactionMode: 'auth' | 'authAndCapture' | 'credit'
  /**
   * Email for invoice delivery
   */
  invoiceEmail?: string
  /**
   * Save card for future use
   */
  saveCard?: boolean
  /**
   * URL to redirect after payment completion
   */
  backUrl: string
  /**
   * Custom data from order
   */
  customData?: string
  /**
   * Customer information
   */
  customer: {
    /**
     * External customer identifier
     */
    identifier: string
    /**
     * Customer first name
     */
    firstName?: string
    /**
     * Customer last name
     */
    lastName?: string
    /**
     * Country code (ISO 3166-1 alpha-2)
     */
    country?: string
    /**
     * City name
     */
    city?: string
    /**
     * Phone number
     */
    phone?: string
    /**
     * Email address
     */
    email?: string
    /**
     * Customer tags
     */
    tags?: string[]
  }
  /**
   * Order information
   */
  order: {
    /**
     * External order ID
     */
    orderId: string
    /**
     * Order type
     */
    type: 'purchase' | 'recurring' | 'managed' | 'credit'
    /**
     * Order amount
     */
    amount: number
    /**
     * Currency code (ISO 4217)
     */
    currency: string
    /**
     * Order description
     */
    description: string
  }
}

/**
 * Parameters for creating a checkout session
 */
export interface CheckoutCreateParams extends Omit<PaymentRequest, 'siteId'> {
  /**
   * Public key in format: pk_<env>_<siteId>
   * Environment can be 'test' or 'live'
   */
  publicKey: string
}

/**
 * Parameters for creating a checkout form
 */
export interface CheckoutCreateFormParams extends CheckoutCreateParams {
  /**
   * Checkout URL (default: https://secure.twispay.com)
   */
  url?: string | null
}

/**
 * Response from checkout creation
 */
export interface CheckoutCreateResponse {
  /**
   * Base64-encoded payment request payload
   */
  payload: string
  /**
   * HMAC-SHA512 checksum for request validation
   */
  checksum: string
}

/**
 * Transaction status from checkout response
 */
type XMoneyTransactionStatus = 'complete-ok' | 'complete-failed' | 'in-progress' | 'refund-ok'

/**
 * Decrypted response from checkout completion
 */
export interface CheckoutResponse {
  /**
   * Transaction status
   */
  transactionStatus: XMoneyTransactionStatus
  /**
   * Internal order ID
   */
  orderId: number
  /**
   * External order ID provided in request
   */
  externalOrderId: string
  /**
   * Transaction ID
   */
  transactionId: number
  /**
   * Payment method used
   */
  transactionMethod: string
  /**
   * Customer ID
   */
  customerId: number
  /**
   * Customer identifier
   */
  identifier: string
  /**
   * Transaction amount
   */
  amount: number
  /**
   * Currency code
   */
  currency: string
  /**
   * Custom data from order
   */
  customData: string | null
  /**
   * Custom fields from order
   */
  customFields: { [key: string]: string } | null
  /**
   * Unix timestamp
   */
  timestamp: number
  /**
   * Saved card ID if card was saved
   */
  cardId: number | undefined
  /**
   * Error details if transaction failed
   */
  errors?: {
    /**
     * Error code
     */
    code: number
    /**
     * Error message
     */
    message: string
    /**
     * Error type
     */
    type: string
  }[]
}

/**
 * Resource for managing hosted checkout sessions
 *
 * Provides secure payment form generation and response decryption
 * for PCI-compliant payment processing
 *
 * @example
 * ```typescript
 * const xMoney = createXMoneyClient({ apiKey: 'your-api-key' })
 *
 * // Create checkout session
 * const { payload, checksum } = xMoney.checkout.create({
 *   publicKey: 'pk_test_your-site-id',
 *   backUrl: 'https://example.com/payment/complete',
 *   customer: {
 *     identifier: 'CUST-123',
 *     email: 'customer@example.com'
 *   },
 *   order: {
 *     orderId: 'ORDER-123',
 *     type: 'purchase',
 *     amount: 99.99,
 *     currency: 'USD',
 *     description: 'Product purchase'
 *   },
 *   cardTransactionMode: 'authAndCapture'
 * })
 * ```
 */
export class CheckoutResource {
  constructor(
    private readonly client: XMoneyCore,
    private readonly platform: PlatformProvider,
  ) {}

  /**
   * Create a checkout session
   * @param params - Checkout parameters
   * @returns Payload and checksum for form submission
   * @throws {XMoneyError} If public key is invalid
   */
  create(params: CheckoutCreateParams): CheckoutCreateResponse {
    if (!params.publicKey) {
      throw new XMoneyError('Public key is required for hosted checkout')
    }

    const publicKeyMatch = params.publicKey.match(/^pk_(test|live)_(.+)$/)
    if (!publicKeyMatch) {
      throw new XMoneyError('Invalid public key format. Expected: pk_<env>_<key>')
    }

    const siteId = publicKeyMatch[2]

    const data: PaymentRequest = {
      siteId,
      saveCard: params.saveCard ?? false,
      ...params,
    }

    const jsonText = JSON.stringify(data)
    const uint8Array = this.platform.buffer.from(jsonText, 'utf8')
    const payload = this.platform.buffer.toString(uint8Array, 'base64')
    const checksum = this.generateChecksum(data)

    return { payload, checksum }
  }

  /**
   * Generate an HTML form for checkout
   * @param params - Checkout parameters
   * @returns HTML form with auto-submit script
   *
   * @example
   * ```typescript
   * const formHtml = xMoney.checkout.form({
   *   publicKey: 'pk_test_your-site-id',
   *   backUrl: 'https://example.com/complete',
   *   // ... other params
   * })
   *
   * // Render formHtml in your page
   * ```
   */
  form(params: CheckoutCreateFormParams): string {
    const { payload, checksum } = this.create(params)

    const checkoutUrl = params.url ?? 'https://secure.twispay.com'

    return `
<form id="checkout-form" name="checkout-form" action="${checkoutUrl}" method="POST" accept-charset="UTF-8">
  <input type="hidden" name="jsonRequest" value="${payload}">
  <input type="hidden" name="checksum" value="${checksum}">
  <input type="submit" style="visibility:hidden">
</form>
<script type="text/javascript">
  window.onload = function() {
    window.setTimeout('document.checkoutForm.submit()', 200)
  }
</script>`
  }

  /**
   * Decrypt the response from checkout completion
   * @param encryptedResponse - Encrypted response string (format: "iv,encrypted_data")
   * @returns Decrypted checkout response
   * @throws {XMoneyError} If decryption fails
   *
   * @example
   * ```typescript
   * // In your return URL handler
   * const encryptedResponse = request.body.opensslResult
   * const response = xMoney.checkout.decrypt(encryptedResponse)
   *
   * if (response.transactionStatus === 'complete-ok') {
   *   // Payment successful
   * }
   * ```
   */
  decrypt(encryptedResponse: string): CheckoutResponse {
    const [ivBase64, encryptedBase64] = encryptedResponse.split(',', 2)

    if (!ivBase64 || !encryptedBase64) {
      throw new XMoneyError('Invalid encrypted response format')
    }

    const iv = this.platform.buffer.from(ivBase64, 'base64')
    const encryptedData = this.platform.buffer.from(encryptedBase64, 'base64')

    const decipher = this.platform.crypto.createDecipherAes256Cbc(
      this.client.config.apiKey,
      iv,
    )

    const decrypted = this.platform.buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]).toString()

    try {
      return JSON.parse(decrypted) as CheckoutResponse
    }
    catch {
      throw new XMoneyError('Failed to parse decrypted response' /** { cause: error } */)
    }
  }

  /**
   * Generate HMAC-SHA512 checksum for request validation
   * @param data - Data to checksum
   * @returns Base64-encoded checksum
   * @private
   */
  private generateChecksum(data: any): string {
    const hmac = this.platform.crypto.createHmacSha512(this.client.config.apiKey)
    hmac.update(JSON.stringify(data))
    const digest = hmac.digest()
    return this.platform.buffer.toString(digest, 'base64')
  }
}

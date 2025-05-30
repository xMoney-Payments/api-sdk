import type { PlatformProvider } from '../platform/types'
import type { XMoneyCore } from '../types'
import { XMoneyError } from '../core'

export interface PaymentRequest {
  siteId: string
  cardTransactionMode: 'auth' | 'authAndCapture' | 'credit'
  invoiceEmail?: string
  saveCard?: boolean
  backUrl: string
  customer: {
    identifier: string
    firstName?: string
    lastName?: string
    country?: string
    city?: string
    phone?: string
    email?: string
    tags?: string[]
  }
  order: {
    orderId: string
    type: 'purchase' | 'recurring' | 'managed' | 'credit'
    amount: number
    currency: string
    description: string
  }
}

export interface CheckoutCreateParams extends Omit<PaymentRequest, 'siteId'> {
  publicKey: string
}

export interface CheckoutCreateFormParams extends CheckoutCreateParams {
  url?: string | null
}

export interface CheckoutCreateResponse {
  payload: string
  checksum: string
}

type XMoneyTransactionStatus = 'complete-ok' | 'complete-failed' | 'in-progress' | 'refund-ok'

export interface CheckoutResponse {
  transactionStatus: XMoneyTransactionStatus
  orderId: number
  externalOrderId: string
  transactionId: number
  transactionMethod: string
  customerId: number
  identifier: string
  amount: number
  currency: string
  customData: { [key: string]: string } | null
  customFields: { [key: string]: string } | null
  timestamp: number
  cardId: number | undefined
  errors?: {
    code: number
    message: string
    type: string
  }[]
}

export class CheckoutResource {
  constructor(
    private readonly client: XMoneyCore,
    private readonly platform: PlatformProvider,
  ) {}

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
    // const url = this.buildCheckoutUrl(payload, checksum)

    return { payload, checksum }
  }

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

  private generateChecksum(data: any): string {
    const hmac = this.platform.crypto.createHmacSha512(this.client.config.apiKey)
    hmac.update(JSON.stringify(data))
    const digest = hmac.digest()
    return this.platform.buffer.toString(digest, 'base64')
  }
}

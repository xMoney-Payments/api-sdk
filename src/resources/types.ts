/**
 * Tag information for categorizing resources
 */
export interface Tag {
  /**
   * Tag identifier
   */
  tag: string
  /**
   * ISO 8601 date-time when the tag was created
   */
  creationDate: string
  /**
   * Unix timestamp of tag creation
   */
  creationTimestamp: number
}

/**
 * Supported credit/debit card types
 */
export type CardType =
  | 'visa'
  | 'mastercard'
  | 'maestro'
  | 'amex'
  | 'jcb'
  | 'dankort'
  | 'diners'
  | 'discover'
  | 'mir'
  | 'unionpay'

/**
 * Supported card payment providers
 */
export type CardProvider =
  | 'apcopay'
  | 'argus'
  | 'billfirst'
  | 'decta'
  | 'emerchantpay'
  | 'epg'
  | 'firstdata'
  | 'kalixa'
  | 'maxpay'
  | 'nmi'
  | 'optimal'
  | 'payon'
  | 'payone'
  | 'payvision'
  | 'postfinance'
  | 'rocketgate'
  | 'romcard'
  | 'safecharge'
  | 'wirecard'
  | 'worldline'

/**
 * Supported wallet and alternative payment methods
 */
export type WalletType =
  | 'neteller'
  | 'paypal'
  | 'paysafecard'
  | 'skrill'
  | 'sofort'
  | 'trustly'
  | 'astropaycard'
  | 'astropaydirect'
  | 'banamex'
  | 'bancodechile'
  | 'bancodeoccidente'
  | 'bancodobrasil'
  | 'bancontact'
  | 'boletobancario'
  | 'directpayeu'
  | 'eps'
  | 'giropay'
  | 'ideal'
  | 'mybank'
  | 'poli'
  | 'postfinance'
  | 'sepa'
  | 'verkkopankki'
  | 'bitcoin'
  | 'etherum'

/**
 * Supported wallet payment providers
 */
export type WalletProvider =
  | 'alternativepayments'
  | 'bitcoinromania'
  | 'neteller'
  | 'paypal'
  | 'paysafecard'
  | 'skrill'
  | 'sofort'
  | 'trustly'

/**
 * Alias for WalletType for backward compatibility
 */
export type WalletBrand = WalletType

/**
 * Reasons for transaction refunds
 */
export type RefundReason =
  | 'fraud-confirm'
  | 'highly-suspicious'
  | 'duplicated-transaction'
  | 'customer-demand'
  | 'test-transaction'
  | 'card-expired'

export interface Tag {
  tag: string
  creationDate: string // ISO 8601 date-time
  creationTimestamp: number
}

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

export type WalletProvider =
  | 'alternativepayments'
  | 'bitcoinromania'
  | 'neteller'
  | 'paypal'
  | 'paysafecard'
  | 'skrill'
  | 'sofort'
  | 'trustly'

export type WalletBrand = WalletType

export type RefundReason =
  | 'fraud-confirm'
  | 'highly-suspicious'
  | 'duplicated-transaction'
  | 'customer-demand'
  | 'test-transaction'
  | 'card-expired'

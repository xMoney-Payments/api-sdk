export interface Tag {
  tag: string
  creationDate: string
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

export type RefundReason =
  | 'fraud-confirm'
  | 'highly-suspicious'
  | 'duplicated-transaction'
  | 'customer-demand'
  | 'test-transaction'
  | 'card-expired'

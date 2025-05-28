import type { xMoneyOrderResponseDataRedirectDto } from './xmoney-order-response-data-redirect.dto'

export interface xMoneyOrderResponseDataDto {
  orderId: number
  transactionId: number
  cardId: number
  isRedirect?: boolean
  is3d?: number
  redirect?: xMoneyOrderResponseDataRedirectDto
}

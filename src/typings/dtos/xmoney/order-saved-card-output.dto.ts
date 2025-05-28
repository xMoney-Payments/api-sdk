import type { xMoneyOrderResponseDataRedirectDto } from './xmoney-order-response-data-redirect.dto'
import type { xMoneyOrderResponseDataDto } from './xmoney-order-response-data.dto'

export interface OrderSavedCardOutputDto {
  isThreeDSecure: boolean
  data: xMoneyOrderResponseDataRedirectDto | xMoneyOrderResponseDataDto
}

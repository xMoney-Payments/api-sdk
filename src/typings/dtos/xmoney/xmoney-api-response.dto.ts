import type { xMoneyResponseCodeEnum } from '../../enums'
import type { xMoneyApiErrorDto } from './xmoney-api-error.dto'

export interface xMoneyApiResponseDto<T> {
  code: xMoneyResponseCodeEnum
  message: string
  data?: T
  error?: xMoneyApiErrorDto[]
}

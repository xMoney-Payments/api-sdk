import type { xMoneyResponseCodeEnum } from '../../enums'

export interface xMoneyApiErrorDto {
  code: xMoneyResponseCodeEnum
  message: string
  type: string
}

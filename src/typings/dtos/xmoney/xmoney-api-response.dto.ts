import { xMoneyResponseCodeEnum } from "../../enums";
import { xMoneyApiErrorDto } from "./xmoney-api-error.dto";

export class xMoneyApiResponseDto<T> {
  code: xMoneyResponseCodeEnum;
  message: string;
  data?: T;
  error?: xMoneyApiErrorDto[];
}

import { XMoneyResponseCodeEnum } from "../../enums";
import { XMoneyApiErrorDto } from "./xmoney-api-error.dto";

export class XMoneyApiResponseDto<T> {
  code: XMoneyResponseCodeEnum;
  message: string;
  data?: T;
  error?: XMoneyApiErrorDto[];
}

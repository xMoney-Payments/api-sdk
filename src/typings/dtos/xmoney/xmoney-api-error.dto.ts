import { XMoneyResponseCodeEnum } from "../../enums";

export class XMoneyApiErrorDto {
  code: XMoneyResponseCodeEnum;
  message: string;
  type: string;
}

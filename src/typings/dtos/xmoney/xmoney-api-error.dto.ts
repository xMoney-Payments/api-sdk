import { xMoneyResponseCodeEnum } from "../../enums";

export class xMoneyApiErrorDto {
  code: xMoneyResponseCodeEnum;
  message: string;
  type: string;
}

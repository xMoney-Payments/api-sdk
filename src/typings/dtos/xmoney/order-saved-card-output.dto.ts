import { XMoneyOrderResponseDataRedirectDto } from "./xmoney-order-response-data-redirect.dto";
import { XMoneyOrderResponseDataDto } from "./xmoney-order-response-data.dto";

export class OrderSavedCardOutputDto {
  isThreeDSecure: boolean;
  data: XMoneyOrderResponseDataRedirectDto | XMoneyOrderResponseDataDto;
}

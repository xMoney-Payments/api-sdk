import { xMoneyOrderResponseDataRedirectDto } from "./xmoney-order-response-data-redirect.dto";
import { xMoneyOrderResponseDataDto } from "./xmoney-order-response-data.dto";

export class OrderSavedCardOutputDto {
  isThreeDSecure: boolean;
  data: xMoneyOrderResponseDataRedirectDto | xMoneyOrderResponseDataDto;
}

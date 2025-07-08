import { xMoneyCreateOrderResponseDataRedirectDto } from "./xmoney-create-order-response-data-redirect.dto";
import { xMoneyCreateOrderResponseDataDto } from "./xmoney-create-order-response-data.dto";

export class OrderSavedCardOutputDto {
  isThreeDSecure: boolean;
  data: xMoneyCreateOrderResponseDataRedirectDto | xMoneyCreateOrderResponseDataDto;
}

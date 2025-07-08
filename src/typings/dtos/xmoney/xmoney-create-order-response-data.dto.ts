import { xMoneyCreateOrderResponseDataRedirectDto } from "./xmoney-create-order-response-data-redirect.dto";

export class xMoneyCreateOrderResponseDataDto {
  orderId: number;
  transactionId: number;
  cardId: number;
  isRedirect?: boolean;
  is3d?: number;
  redirect?: xMoneyCreateOrderResponseDataRedirectDto;
}

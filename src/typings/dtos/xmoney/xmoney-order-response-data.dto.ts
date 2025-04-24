import { XMoneyOrderResponseDataRedirectDto } from "./xmoney-order-response-data-redirect.dto";

export class XMoneyOrderResponseDataDto {
  orderId: number;
  transactionId: number;
  cardId: number;
  isRedirect?: boolean;
  is3d?: number;
  redirect?: XMoneyOrderResponseDataRedirectDto;
}

import { xMoneyOrderResponseDataRedirectDto } from "./xmoney-order-response-data-redirect.dto";

export class xMoneyOrderResponseDataDto {
  orderId: number;
  transactionId: number;
  cardId: number;
  isRedirect?: boolean;
  is3d?: number;
  redirect?: xMoneyOrderResponseDataRedirectDto;
}

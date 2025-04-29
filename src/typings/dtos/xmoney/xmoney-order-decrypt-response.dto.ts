import { xMoneyTransactionStatusEnum } from "../../enums/xmoney-transaction-status.enum";

export class xMoneyOrderDecryptResponseDto {
  transactionStatus: xMoneyTransactionStatusEnum;
  orderId: number;
  externalOrderId: string;
  transactionId: number;
  transactionMethod: string;
  customerId: number;
  identifier: string;
  amount: number;
  currency: string;
  customData: {
    [key: string]: string;
  } | null;
  customFields: {
    [key: string]: string;
  } | null;
  timestamp: number;
  cardId: number | undefined;
  errors?: {
    code: number;
    message: string;
    type: string;
  }[];
}

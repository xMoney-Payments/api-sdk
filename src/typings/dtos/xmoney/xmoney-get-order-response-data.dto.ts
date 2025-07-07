import { xMoneyOrderStatusEnum, xMoneyTransactionMethodEnum } from "src/typings/enums";

export class xMoneyGetOrderResponseDataDto {
  id: number;
  siteId: number;
  customerId: number;
  externalOrderId: string;
  orderType: string;
  orderStatus: xMoneyOrderStatusEnum;
  amount: number;
  currency: string;
  description: string;
  invoiceEmail: string;
  createdAt: Date;
  intervalType: string;
  intervalValue: number;
  retryPayment: string;
  nextDueDate: Date;
  transactionMethod: xMoneyTransactionMethodEnum;
}

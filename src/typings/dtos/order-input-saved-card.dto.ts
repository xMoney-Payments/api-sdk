import {
  FiatCurrenciesEnum,
  xMoneyCardTransactionModeEnum,
  xMoneyOrderTypeEnum,
  xMoneyTransactionMethodEnum,
} from '../enums';

export class OrderInputSavedCardDto {
  customerId: number;
  ip: string;
  amount: number;
  currency: FiatCurrenciesEnum;
  externalOrderId: string;
  orderType: xMoneyOrderTypeEnum;
  transactionMethod: xMoneyTransactionMethodEnum;
  cardTransactionMode: xMoneyCardTransactionModeEnum;
  cardId: number;
  transactionOption?: string;
}

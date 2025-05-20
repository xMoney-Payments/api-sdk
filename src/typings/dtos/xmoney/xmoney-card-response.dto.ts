export class xMoneyCardResponseDto {
    id: number;
    customerId: number;
    type: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    nameOnCard: string;
    cardHolderCountry: string;
    cardHolderState: string;
    cardProvider: string;
    hasToken: boolean;
    cardStatus: string;
    binInfo: CardBinInfoDto;
  }
  
  class CardBinInfoDto {
    bin: string;
    brand: string;
    type: string;
    level: string;
    countryCode: string;
    bank: string;
  }
  
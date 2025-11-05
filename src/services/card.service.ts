import { FiatCurrenciesEnum } from '../typings/enums';
import {
  ApiResponseDto,
  OrderOutputDto,
  SaveCardInputDto,
  xMoneyApiResponseDto,
  xMoneyCardResponseDto,
  xMoneyOrder,
} from '../typings/dtos';
import { CommonService } from './common.service';
import { xMoneyApiService } from './xmoney-api.service';

export class CardService {
  private commonService: CommonService;
  private xMoneyApiService: xMoneyApiService;
  private SAVE_CARD_AMOUNT_EUR = 0.1;

  public constructor(commonService: CommonService) {
    this.commonService = commonService;
    this.xMoneyApiService = new xMoneyApiService(this.commonService);
  }

  public saveCard(saveCardInput: SaveCardInputDto): OrderOutputDto {
    const publicKey = this.commonService.getPublicKey(saveCardInput);

    const order: xMoneyOrder = {
      siteId: publicKey,
      cardTransactionMode: 'auth',
      saveCard: true,
      ...saveCardInput,
      order: {
        ...saveCardInput.order,
        type: 'purchase',
        amount: this.SAVE_CARD_AMOUNT_EUR,
        currency: FiatCurrenciesEnum.EUR,
      },
    };

    const base64Json = this.commonService.getBase64JsonRequest(order);
    const base64Checksum = this.commonService.getBase64Checksum(order);
    return {
      payload: base64Json,
      checksum: base64Checksum,
    };
  }

  public async deleteCard(cardId: number): Promise<xMoneyApiResponseDto<unknown>> {
    return await this.xMoneyApiService.deleteCardById(cardId);
  }

  public async getCards(
    xMoneyCustomerId: number,
  ): Promise<ApiResponseDto<xMoneyCardResponseDto[]>> {
    const cardsResponse = await this.xMoneyApiService.getCardsByxMoneyCustomerId(xMoneyCustomerId);

    if (cardsResponse.error) {
      throw new Error(
        cardsResponse.error?.length ? cardsResponse.error[0].message : 'Unknown error',
      );
    }

    const uniqueCards = [
      ...new Map((cardsResponse?.data || []).map((item) => [item['cardNumber'], item])).values(),
    ];

    cardsResponse.data = uniqueCards;
    return { data: cardsResponse.data };
  }
}

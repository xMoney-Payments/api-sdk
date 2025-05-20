import { FiatCurrenciesEnum } from '../typings/enums';
import {
  ApiResponseDto,
  InitInputDto,
  OrderOutputDto,
  SaveCardInputDto,
  xMoneyApiErrorDto,
  xMoneyCardResponseDto,
  xMoneyOrder,
} from '../typings/dtos';
import { CommonService } from './common.service';
import { xMoneyApiService } from './xmoney-api.service';

export class CardService {
  private commonService: CommonService;
  private xMoneyApiService: xMoneyApiService;
  private SAVE_CARD_AMOUNT_EUR = 0.1;

  public constructor(initParams: InitInputDto) {
    this.commonService = new CommonService(initParams);
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

  public async getCards(
    xMoneyCustomerId: number,
  ): Promise<ApiResponseDto<xMoneyCardResponseDto[], xMoneyApiErrorDto[]>> {
    return await this.xMoneyApiService.getCardsByxMoneyCustomerId(xMoneyCustomerId);
  }
}

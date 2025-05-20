import {
  ApiResponseDto,
  CardDto,
  InitInputDto,
  OrderInputDto,
  OrderInputSavedCardDto,
  OrderOutputDto,
  SaveCardInputDto,
  xMoneyApiErrorDto,
  xMoneyApiResponseDto,
  xMoneyOrderDecryptResponseDto,
  xMoneyOrderResponseDataDto,
} from './typings/dtos';
import { OrderService } from './services/order.service';
import { CardService } from './services/card.service';
import { CommonService } from './services/common.service';

export default class xMoney {
  private commonService: CommonService;
  private orderService: OrderService;
  private cardService: CardService;

  constructor(initParams: InitInputDto) {
    this.commonService = new CommonService(initParams);
    this.orderService = new OrderService(this.commonService);
    this.cardService = new CardService(this.commonService);
  }

  public initializeCheckout(input: OrderInputDto): OrderOutputDto {
    return this.orderService.createOrder(input);
  }

  public initializeHostedCheckout(input: OrderInputDto): string {
    return this.orderService.createOrderWithHtml(input);
  }

  public decryptOrderResponse(input: string): xMoneyOrderDecryptResponseDto {
    return this.orderService.decryptOrderResponse(input);
  }

  public initializeCardSave(input: SaveCardInputDto): OrderOutputDto {
    return this.cardService.saveCard(input);
  }

  public getCards(customerId: number): Promise<ApiResponseDto<CardDto[], xMoneyApiErrorDto[]>> {
    return this.cardService.getCards(customerId);
  }

  public initializeCheckoutWithSavedCard(
    input: OrderInputSavedCardDto,
  ): Promise<xMoneyApiResponseDto<xMoneyOrderResponseDataDto | xMoneyApiErrorDto>> {
    return this.orderService.createOrderWithSavedCard(input);
  }
}

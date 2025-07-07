import {
  ApiResponseDto,
  CardDto,
  InitInputDto,
  OrderInputDto,
  OrderInputSavedCardDto,
  OrderOutputDto,
  SaveCardInputDto,
  xMoneyOrderDecryptResponseDto,
  xMoneyCreateOrderResponseDataDto,
  xMoneyCardResponseDto,
  OrderDetailsDto,
} from './typings/dtos';
import { OrderService } from './services/order.service';
import { CardService } from './services/card.service';
import { CommonService } from './services/common.service';
import { ThemeEnum } from './typings/enums';

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

  public async initializeStandaloneCheckoutPage(
    input: OrderInputDto,
    theme: ThemeEnum = ThemeEnum.Dark,
    xMoneyCustomerId?: number, // used to display cards
  ): Promise<string> {
    let cards = [] as xMoneyCardResponseDto[];
    if (xMoneyCustomerId) {
      const cardsResponse = await this.getCards(xMoneyCustomerId);
      cards = cardsResponse.data ?? [];
    }
    return this.orderService.createOrderWithHtmlPage(input, cards, theme);
  }

  public decryptOrderResponse(input: string): xMoneyOrderDecryptResponseDto {
    return this.orderService.decryptOrderResponse(input);
  }

  public initializeCardSave(input: SaveCardInputDto): OrderOutputDto {
    return this.cardService.saveCard(input);
  }

  public getCards(customerId: number): Promise<ApiResponseDto<CardDto[]>> {
    return this.cardService.getCards(customerId);
  }

  public getOrder(orderId: string): Promise<ApiResponseDto<OrderDetailsDto>>{
    return this.orderService.getOrderById(orderId);
  }

  public initializeCheckoutWithSavedCard(
    input: OrderInputSavedCardDto,
  ): Promise<ApiResponseDto<xMoneyCreateOrderResponseDataDto>> {
    return this.orderService.createOrderWithSavedCard(input);
  }
}

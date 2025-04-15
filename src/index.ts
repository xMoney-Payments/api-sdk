import {
  InitInputDto,
  OrderInputDto,
  OrderOutputDto,
  XMoneyOrderDecryptResponseDto,
} from "./typings/dtos";
import { OrderService } from "./services/order.service";

export default class InlineCheckoutApiSdk {
  private orderService: OrderService;

  constructor(initParams: InitInputDto) {
    this.orderService = new OrderService(initParams.secretKey);
  }

  public initializeCheckout(input: OrderInputDto): OrderOutputDto {
    return this.orderService.createOrder(input);
  }

  public decryptOrderResponse(input: string): XMoneyOrderDecryptResponseDto {
    return this.orderService.decryptOrderResponse(input);
  }
}

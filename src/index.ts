import type { InitInputDto, OrderInputDto, OrderOutputDto, xMoneyOrderDecryptResponseDto } from './typings/dtos'
import { OrderService } from './services/order.service'

export default class xMoney {
  private orderService: OrderService

  constructor(initParams: InitInputDto) {
    this.orderService = new OrderService(
      initParams.secretKey,
    )
  }

  public initializeCheckout(input: OrderInputDto): OrderOutputDto {
    return this.orderService.createOrder(input)
  }

  public initializeHostedCheckout(input: OrderInputDto): string {
    return this.orderService.createOrderWithHtml(input)
  }

  public decryptOrderResponse(input: string): xMoneyOrderDecryptResponseDto {
    return this.orderService.decryptOrderResponse(input)
  }
}

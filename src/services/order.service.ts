import * as crypto from 'crypto';
import { OrderInputDto } from '../typings/dtos/order-input.dto';
import {
  ApiResponseDto,
  OrderInputSavedCardDto,
  OrderOutputDto,
  xMoneyOrder,
  xMoneyOrderDecryptResponseDto,
  xMoneyOrderResponseDataDto,
} from '../typings/dtos';
import { CommonService } from './common.service';
import { xMoneyApiService } from './xmoney-api.service';
import { xMoneyResponseCodeEnum } from '../typings/enums';

export class OrderService {
  private commonService: CommonService;
  private apiService: xMoneyApiService;

  public constructor(commonService: CommonService) {
    this.commonService = commonService;
    this.apiService = new xMoneyApiService(commonService);
  }

  public createOrder(orderInput: OrderInputDto): OrderOutputDto {
    const publicKey = this.commonService.getPublicKey(orderInput);

    const order: xMoneyOrder = {
      siteId: publicKey,
      ...orderInput,
    };
    if (!order.saveCard) {
      order.saveCard = false;
    }
    const base64Json = this.commonService.getBase64JsonRequest(order);
    const base64Checksum = this.commonService.getBase64Checksum(order);
    return {
      payload: base64Json,
      checksum: base64Checksum,
    };
  }

  public createOrderWithHtml(orderInput: OrderInputDto) {
    const envUrl = this.commonService.getUrl();

    const order = this.createOrder(orderInput);

    return `<form id="checkoutForm" name="checkoutForm" 
    action="${envUrl}" method="post" accept-charset="UTF-8">
    <input type="hidden" name="jsonRequest" value="${order.payload}">
    <input type="hidden" name="checksum" value="${order.checksum}">
    <input type="submit" style="visibility:hidden">
    </form>
    <script type="text/javascript">
      window.onload=function(){
        window.setTimeout('document.checkoutForm.submit()', 200)
      }
    </script>`;
  }

  public async createOrderWithSavedCard(
    orderInput: OrderInputSavedCardDto,
    iteration = 0,
  ): Promise<ApiResponseDto<xMoneyOrderResponseDataDto>> {
    // Allow maximum 2 recursive calls
    if (iteration === 2) {
      throw new Error('Maximum iterations limit exceeded for create order');
    }

    const order = await this.apiService.createOrder(orderInput);

    if (
      order.data &&
      (order.code === xMoneyResponseCodeEnum.Success ||
        order.code === xMoneyResponseCodeEnum.Created)
    ) {
      return { data: order.data };
    }

    // if error code is soft decline, we can try again
    if (order.error && order.error.find((e) => e.code === xMoneyResponseCodeEnum.SoftDecline)) {
      const softDeclineInput = {
        ...orderInput,
        transactionOption: JSON.stringify({
          isSoftDecline: 'yes',
        }),
      };

      return await this.createOrderWithSavedCard(softDeclineInput, ++iteration);
    } else {
      // if error code is not soft decline, return error
      throw new Error(order.error?.length ? order.error[0].message : 'Unknown error');
    }
  }

  public decryptOrderResponse(encryptedResponse: string): xMoneyOrderDecryptResponseDto {
    // get the IV and the encrypted data
    const encryptedParts = encryptedResponse.split(',', 2),
      iv = Buffer.from(encryptedParts[0], 'base64'),
      encryptedData = Buffer.from(encryptedParts[1], 'base64');

    // decrypt the encrypted data
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.commonService.getPrivateKey(), iv),
      decryptedIpnResponse = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]).toString();

    // JSON decode the decrypted data
    return JSON.parse(decryptedIpnResponse) as xMoneyOrderDecryptResponseDto;
  }
}

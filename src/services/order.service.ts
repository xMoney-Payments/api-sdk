import * as crypto from 'crypto';
import { OrderInputDto } from '../typings/dtos/order-input.dto';
import { OrderOutputDto, xMoneyOrder, xMoneyOrderDecryptResponseDto } from '../typings/dtos';
import { LIVE_ENV, LIVE_ENV_URL, TEST_ENV, TEST_ENV_URL } from '../typings/constants';

export class OrderService {
  private secretKey: string;
  private secretKeyEnv: string | null;

  private hostedCheckoutRedirectUrl: { [key: string]: string } = {
    [TEST_ENV]: TEST_ENV_URL,
    [LIVE_ENV]: LIVE_ENV_URL,
  };

  public constructor(secretKey: string) {
    this.secretKey = this.extractKeyFromSecretKey(secretKey);
    this.secretKeyEnv = this.extractEnvFromSecretKey(secretKey);
  }

  public createOrder(orderInput: OrderInputDto): OrderOutputDto {
    const publicKey = orderInput.publicKey;

    const key = this.extractKeyFromPublicKey(publicKey);
    if (!key) {
      throw new Error('Invalid public key format. Expected format: pk_<env>_key');
    }

    const order: xMoneyOrder = {
      siteId: key,
      ...orderInput,
    };
    if (!order.saveCard) {
      order.saveCard = false;
    }
    const base64Json = this.getBase64JsonRequest(order);
    const base64Checksum = this.getBase64Checksum(order);
    return {
      payload: base64Json,
      checksum: base64Checksum,
    };
  }

  public createOrderWithHtml(orderInput: OrderInputDto) {
    if (!this.secretKeyEnv) {
      throw new Error('Cannot detect url based on secret key');
    }

    const envUrl = this.hostedCheckoutRedirectUrl[this.secretKeyEnv];

    if (!envUrl) {
      throw new Error('HostedCheckoutRedirect url missing');
    }

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

  private extractKeyFromPublicKey(publicKey: string): string | null {
    const envPattern = `${TEST_ENV}|${LIVE_ENV}`;
    const regexp = new RegExp(`^pk_(${envPattern})_(.+)$`);
    const match = publicKey.match(regexp);
    return match ? match[2] : null;
  }

  private extractKeyFromSecretKey(secretKey: string): string {
    const regexp = this.getSecretKeyRegex();
    const match = secretKey.match(regexp);
    return match ? match[2] : secretKey;
  }

  private extractEnvFromSecretKey(secretKey: string): string | null {
    const regexp = this.getSecretKeyRegex();
    const match = secretKey.match(regexp);
    return match ? match[1] : null;
  }

  private getSecretKeyRegex(): RegExp {
    const envPattern = `${TEST_ENV}|${LIVE_ENV}`;
    return new RegExp(`^sk_(${envPattern})_(.+)$`);
  }

  public decryptOrderResponse(encryptedResponse: string): xMoneyOrderDecryptResponseDto {
    // get the IV and the encrypted data
    const encryptedParts = encryptedResponse.split(',', 2),
      iv = Buffer.from(encryptedParts[0], 'base64'),
      encryptedData = Buffer.from(encryptedParts[1], 'base64');

    // decrypt the encrypted data
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.secretKey, iv),
      decryptedIpnResponse = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]).toString();

    // JSON decode the decrypted data
    return JSON.parse(decryptedIpnResponse) as xMoneyOrderDecryptResponseDto;
  }

  private getBase64JsonRequest(orderData: xMoneyOrder): string {
    const jsonText = JSON.stringify(orderData);

    return Buffer.alloc(Buffer.byteLength(jsonText), jsonText).toString('base64');
  }

  private getBase64Checksum(orderData: xMoneyOrder): string {
    const hmacSha512 = crypto.createHmac('sha512', this.secretKey);
    hmacSha512.update(JSON.stringify(orderData));

    return hmacSha512.digest('base64');
  }
}

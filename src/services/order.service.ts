import * as crypto from "crypto";
import { OrderInputDto } from "../typings/dtos/order-input.dto";
import { OrderOutputDto, xMoneyOrder, xMoneyOrderDecryptResponseDto } from "../typings/dtos";

export class OrderService {
  private secretKey: string;

  public constructor(secretKey: string) {
    this.secretKey = secretKey;
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

  private extractKeyFromPublicKey(publicKey: string): string | null {
    const match = publicKey.match(/^pk_(test|live)_(.+)$/);
    return match ? match[2] : null;
  }

  public decryptOrderResponse(
    encryptedResponse: string,
  ): xMoneyOrderDecryptResponseDto {
    // get the IV and the encrypted data
    const encryptedParts = encryptedResponse.split(",", 2),
      iv = Buffer.from(encryptedParts[0], "base64"),
      encryptedData = Buffer.from(encryptedParts[1], "base64");

    // decrypt the encrypted data
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.secretKey, iv),
      decryptedIpnResponse = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]).toString();

    // JSON decode the decrypted data
    return JSON.parse(decryptedIpnResponse) as xMoneyOrderDecryptResponseDto;
  }

  private getBase64JsonRequest(orderData: xMoneyOrder): string {
    const jsonText = JSON.stringify(orderData);

    return Buffer.alloc(Buffer.byteLength(jsonText), jsonText).toString(
      "base64"
    );
  }

  private getBase64Checksum(orderData: xMoneyOrder): string {
    const hmacSha512 = crypto.createHmac("sha512", this.secretKey);
    hmacSha512.update(JSON.stringify(orderData));

    return hmacSha512.digest("base64");
  }
}

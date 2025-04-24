import * as crypto from "crypto";
import { OrderInputDto } from "../typings/dtos/order-input.dto";
import { OrderOutputDto, XMoneyOrderDecryptResponseDto } from "../typings/dtos";

export class OrderService {
  private secretKey: string;

  public constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  public createOrder(orderInput: OrderInputDto): OrderOutputDto {
    if (!orderInput.saveCard) {
      orderInput.saveCard = false;
    }
    const base64Json = this.getBase64JsonRequest(orderInput);
    const base64Checksum = this.getBase64Checksum(orderInput);
    return {
      base64Json,
      base64Checksum,
    };
  }

  public decryptOrderResponse(
    encryptedResponse: string
  ): XMoneyOrderDecryptResponseDto {
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
    return JSON.parse(decryptedIpnResponse) as XMoneyOrderDecryptResponseDto;
  }

  private getBase64JsonRequest(orderData: OrderInputDto): string {
    const jsonText = JSON.stringify(orderData);

    return Buffer.alloc(Buffer.byteLength(jsonText), jsonText).toString(
      "base64"
    );
  }

  private getBase64Checksum(orderData: OrderInputDto): string {
    const hmacSha512 = crypto.createHmac("sha512", this.secretKey);
    hmacSha512.update(JSON.stringify(orderData));

    return hmacSha512.digest("base64");
  }
}

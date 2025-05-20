import * as crypto from 'crypto';
import { InitInputDto, OrderInputDto, SaveCardInputDto, xMoneyOrder } from '../typings/dtos';
import {
  LIVE_ENV,
  LIVE_ENV_API_URL,
  LIVE_ENV_URL,
  TEST_ENV,
  TEST_ENV_API_URL,
  TEST_ENV_URL,
} from '../typings/constants';

export class CommonService {
  public secretKey: string;
  public apiKey: string | undefined;
  private secretKeyEnv: string | null;

  public hostedCheckoutRedirectUrl: { [key: string]: string } = {
    [TEST_ENV]: TEST_ENV_URL,
    [LIVE_ENV]: LIVE_ENV_URL,
  };

  public apiUrl: { [key: string]: string } = {
    [TEST_ENV]: TEST_ENV_API_URL,
    [LIVE_ENV]: LIVE_ENV_API_URL,
  };

  public constructor(initParams: InitInputDto) {
    this.secretKey = this.extractKeyFromSecretKey(initParams.secretKey);
    this.secretKeyEnv = this.extractEnvFromSecretKey(initParams.secretKey);
    this.apiKey = initParams.apiKey;
  }

  public getPublicKey(input: OrderInputDto | SaveCardInputDto): string {
    const publicKey = input.publicKey;

    const key = this.extractKeyFromPublicKey(publicKey);
    if (!key) {
      throw new Error('Invalid public key format. Expected format: pk_<env>_key');
    }

    return key;
  }

  public getPrivateKey(): string {
    return this.secretKey;
  }

  public getSecretKeyEnv(): string {
    const env = this.secretKeyEnv;
    if (!env) {
      throw new Error('Cannot detect url based on secret key');
    }

    return env;
  }

  public getUrl(): string {
    const env = this.getSecretKeyEnv();
    const envUrl = this.hostedCheckoutRedirectUrl[env];

    if (!envUrl) {
      throw new Error('HostedCheckoutRedirect url missing');
    }
    return envUrl;
  }

  public getApiBaseUrl(): string {
    const env = this.getSecretKeyEnv();
    const envUrl = this.apiUrl[env];

    if (!envUrl) {
      throw new Error('ApiUrl url missing');
    }
    return envUrl;
  }

  public getApiKey(): string {
    if(!this.apiKey){
      throw new Error('ApiKey missing');
    }

    return this.apiKey;
  }

  public getBase64JsonRequest(orderData: xMoneyOrder): string {
    const jsonText = JSON.stringify(orderData);

    return Buffer.alloc(Buffer.byteLength(jsonText), jsonText).toString('base64');
  }

  public getBase64Checksum(orderData: xMoneyOrder): string {
    const hmacSha512 = crypto.createHmac('sha512', this.secretKey);
    hmacSha512.update(JSON.stringify(orderData));

    return hmacSha512.digest('base64');
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
}

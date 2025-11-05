import qs from 'qs';
import {
  xMoneyApiResponseDto,
  xMoneyCardResponseDto,
  xMoneyApiErrorDto,
  OrderInputSavedCardDto,
  xMoneyCreateOrderResponseDataDto,
  xMoneyGetOrderResponseDataDto,
  xMoneyGetJwtResponseDataDto,
} from '../typings/dtos';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CommonService } from './common.service';

export class xMoneyApiService {
  private commonService: CommonService;
  constructor(commonService: CommonService) {
    this.commonService = commonService;
  }

  async getCardsByxMoneyCustomerId(
    xMoneyCustomerId: number,
  ): Promise<xMoneyApiResponseDto<xMoneyCardResponseDto[]>> {
    let baseQueryParams = `customerId=${xMoneyCustomerId}&hasToken=yes`;

    // Return only the last saved card for now
    const response = await this.get<xMoneyApiResponseDto<xMoneyCardResponseDto[]>>(
      `card?${baseQueryParams}`,
    );

    return response.data;
  }

  async deleteCardById(cardId: number): Promise<xMoneyApiResponseDto<unknown>> {
    const response = await this.delete<xMoneyApiResponseDto<unknown>>(`card/${cardId}`);
    return response.data;
  }

  async createOrder(
    order: OrderInputSavedCardDto,
  ): Promise<xMoneyApiResponseDto<xMoneyCreateOrderResponseDataDto>> {
    const response = await this.post<
      string,
      xMoneyApiResponseDto<xMoneyCreateOrderResponseDataDto>
    >('order', qs.stringify(order), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  async getOrderByExternalId(
    externalId: string,
  ): Promise<xMoneyApiResponseDto<xMoneyGetOrderResponseDataDto[]>> {
    const response = await this.get<xMoneyApiResponseDto<xMoneyGetOrderResponseDataDto[]>>(
      `order?page=0&perPage=1&externalOrderId=${externalId}`,
    );
    return response.data;
  }

  async getSessionToken(): Promise<xMoneyApiResponseDto<xMoneyGetJwtResponseDataDto>> {
    const response =
      await this.get<xMoneyApiResponseDto<xMoneyGetJwtResponseDataDto>>(`auth/session-token`);
    return response.data;
  }

  private getConfig = (): AxiosRequestConfig => {
    return {
      baseURL: this.commonService.getApiBaseUrl(),
      headers: {
        Authorization: `Bearer ${this.commonService.secretKey}`,
      },
    };
  };

  private async get<T = never, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    try {
      return await axios.get(url, {
        ...config,
        ...this.getConfig(),
      });
    } catch (error: any) {
      this.logErrorIfNeeded(error, url);
      return error?.response;
    }
  }

  private async post<TIn, T = never, R = AxiosResponse<T>>(
    url: string,
    data?: TIn,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    try {
      return await axios.post(url, data, {
        ...config,
        ...this.getConfig(),
      });
    } catch (error: any) {
      this.logErrorIfNeeded(error, url);
      return error?.response;
    }
  }

  private async delete<T = never, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    try {
      return await axios.delete(url, {
        ...config,
        ...this.getConfig(),
      });
    } catch (error: any) {
      this.logErrorIfNeeded(error, url);
      return error?.response;
    }
  }

  private stringifyError(error: AxiosError<unknown, xMoneyApiErrorDto>): string {
    if (typeof error?.response?.data === 'object') {
      return JSON.stringify(error?.response?.data);
    }
    return error?.response?.data as string;
  }

  private logErrorIfNeeded(error: AxiosError<unknown, xMoneyApiErrorDto>, url: string): void {
    if (!this.commonService.verbose) {
      return;
    }

    console.error('An error occurred while calling Twispay API Route', {
      route: url,
      error: this.stringifyError(error),
    });
  }
}

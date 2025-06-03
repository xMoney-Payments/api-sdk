import qs from 'qs';
import {
  xMoneyApiResponseDto,
  xMoneyCardResponseDto,
  xMoneyApiErrorDto,
  ApiResponseDto,
  OrderInputSavedCardDto,
  xMoneyOrderResponseDataDto,
} from '../typings/dtos';
import { xMoneyResponseCodeEnum } from '../typings/enums';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CommonService } from './common.service';

export class xMoneyApiService {
  private commonService: CommonService;
  constructor(commonService: CommonService) {
    this.commonService = commonService;
  }

  async getCardsByxMoneyCustomerId(
    xMoneyCustomerId: number,
  ): Promise<ApiResponseDto<xMoneyCardResponseDto[], xMoneyApiErrorDto[]>> {
    let baseQueryParams = `customerId=${xMoneyCustomerId}&hasToken=yes`;


    // Return only the last saved card for now
    const response = await this.get<xMoneyApiResponseDto<xMoneyCardResponseDto[]>>(
      `card?${baseQueryParams}`,
    );

    if (!response?.data || response.data.code !== xMoneyResponseCodeEnum.Success) {
      return { error: response?.data.error };
    }

    return { data: response.data.data };
  }

  async createOrder(
    order: OrderInputSavedCardDto,
  ): Promise<xMoneyApiResponseDto<xMoneyOrderResponseDataDto>> {
    const response = await this.post<string, xMoneyApiResponseDto<xMoneyOrderResponseDataDto>>(
      'order',
      qs.stringify(order),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
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
  ): Promise<R | undefined> {
    try {
      return await axios.get(url, {
        ...config,
        ...this.getConfig(),
      });
    } catch (error: any) {
      console.error('An error occurred while calling Twispay API Route', {
        route: url,
        params: config?.params,
        error: error,
      });
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
      console.error('An error occurred while calling Twispay API Route', {
        route: url,
        params: config?.params,
        error: error,
      });
      return error?.response;
    }
  }
}

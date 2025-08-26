import { ApiResponseDto, xMoneyGetJwtResponseDataDto } from '../typings/dtos';
import { CommonService } from './common.service';
import { xMoneyApiService } from './xmoney-api.service';

export class AuthService {
  private commonService: CommonService;
  private xMoneyApiService: xMoneyApiService;

  public constructor(commonService: CommonService) {
    this.commonService = commonService;
    this.xMoneyApiService = new xMoneyApiService(this.commonService);
  }

  public async getSessionToken(): Promise<ApiResponseDto<xMoneyGetJwtResponseDataDto>> {
    const response = await this.xMoneyApiService.getSessionToken();
    return { data: response.data };
  }
}

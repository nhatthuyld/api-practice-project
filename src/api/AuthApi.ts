import { APIRequestContext } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class AuthApi extends BaseApi {
  constructor(request: APIRequestContext) {
    super(request);
  }

  // Hàm gọi API Đăng nhập
  async login(username: string, password: string) {
    return await this.request.post('/api/login', {
      data: { username, password }
    });
  }
}

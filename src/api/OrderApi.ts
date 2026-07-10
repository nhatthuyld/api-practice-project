import { APIRequestContext } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class OrderApi extends BaseApi {
  constructor(request: APIRequestContext, token?: string) {
    super(request, token);
  }

  async createOrder() {
    return await this.request.post('/api/orders', {
      headers: this.getHeaders()
    });
  }

  async getOrders() {
    return await this.request.get('/api/orders', {
      headers: this.getHeaders()
    });
  }
}

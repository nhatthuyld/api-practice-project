import { APIRequestContext } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class CartApi extends BaseApi {
  constructor(request: APIRequestContext, token?: string) {
    super(request, token);
  }

  async getCart() {
    return await this.request.get('/api/cart', {
      headers: this.getHeaders()
    });
  }

  async addToCart(productId: number, quantity: number) {
    return await this.request.post('/api/cart', {
      data: { productId, quantity },
      headers: this.getHeaders()
    });
  }
}

import { APIRequestContext } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class ProductApi extends BaseApi {
  constructor(request: APIRequestContext, token?: string) {
    super(request, token);
  }

  async getProducts(params?: { search?: string; minPrice?: number; maxPrice?: number }) {
    return await this.request.get('/api/products', {
      params,
      headers: this.getHeaders()
    });
  }


  async getProductById(id: number | string) {
    return await this.request.get(`/api/products/${id}`, {
      headers: this.getHeaders()
    });
  }
}

import { APIRequestContext } from '@playwright/test';

export class BaseApi {
  protected request: APIRequestContext;
  protected token?: string;

  constructor(request: APIRequestContext, token?: string) {
    this.request = request;
    this.token = token;
  }

  // Helper sinh headers, tự động đính kèm Token Authorization nếu có
  protected getHeaders(extraHeaders?: Record<string, string>) {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...extraHeaders
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }
}

import { APIRequestContext } from '@playwright/test';

export class BaseApi {
  protected request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }
}

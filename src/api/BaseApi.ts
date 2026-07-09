import { APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export class BaseApi {
  protected request: APIRequestContext;
  protected token?: string;

  constructor(request: APIRequestContext, token?: string) {
    this.request = request;
    // Nếu truyền token trực tiếp thì dùng, nếu không sẽ tự động đọc từ file token.json
    this.token = token || this.loadTokenFromSetup();
  }

  // Đọc token đã được lưu bởi auth.setup.ts
  private loadTokenFromSetup(): string | undefined {
    const tokenPath = path.resolve(process.cwd(), 'playwright/.auth/token.json');
    if (fs.existsSync(tokenPath)) {
      try {
        const fileContent = fs.readFileSync(tokenPath, 'utf-8');
        const authData = JSON.parse(fileContent);
        return authData.token;
      } catch (error) {
        console.warn('⚠️ Lỗi khi đọc file token:', error);
        return undefined;
      }
    }
    return undefined;
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

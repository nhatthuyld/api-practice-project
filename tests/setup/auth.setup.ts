import { test as setup, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import fs from 'fs';
import path from 'path';

// File lưu trữ Token tạm thời
const tokenPath = path.resolve(process.cwd(), 'playwright/.auth/token.json');

setup('đăng nhập hệ thống và lấy token', async ({ request }) => {
  const authApi = new AuthApi(request);
  const response = await authApi.login(
    process.env.TEST_USERNAME || '',
    process.env.TEST_PASSWORD || ''
  );
  
  expect(response.status()).toBe(200);
  const body = await response.json();
  
  // Tạo thư mục nếu chưa tồn tại
  const authFolder = path.dirname(tokenPath);
  if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
  }
  
  // Ghi token vào file JSON
  fs.writeFileSync(tokenPath, JSON.stringify({ token: body.token }, null, 2));
  console.log('🔑 Đã lưu trữ Token thành công cho toàn cục!');
});

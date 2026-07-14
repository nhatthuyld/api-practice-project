import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  // Tự động khởi động Mock API Server khi chạy test
  webServer: {
    command: 'npm run server',
    url: 'http://localhost:3000/api/todos',
    reuseExistingServer: !process.env.CI,
  },


  // Định nghĩa các Projects trong Playwright
  projects: [
    // 1. Dự án Setup: Chạy đầu tiên để đăng nhập lấy Token lưu vào file
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // 2. Dự án kiểm thử API chính: Chỉ chạy sau khi dự án Setup đã hoàn thành
    {
      name: 'api-tests',
      dependencies: ['setup'], // Khai báo phụ thuộc vào setup
      testIgnore: /.*\.setup\.ts/, // Loại trừ file setup khỏi bộ test này
    }
  ]
});

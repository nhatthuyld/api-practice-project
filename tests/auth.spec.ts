import { test, expect } from '@playwright/test';
import { AuthApi } from '../src/api/AuthApi';
import { TodoApi } from '../src/api/TodoApi';
import { TodoArraySchema } from '../src/models/todo.schema';

test.describe('API Authentication & Authorization Tests', () => {

  // =======================================================
  // 1. KIỂM THỬ ĐĂNG NHẬP (AUTHENTICATION)
  // =======================================================

  test('POST /login - Đăng nhập thành công với tài khoản admin', async ({ request }) => {
    const authApi = new AuthApi(request);
    // Sử dụng biến môi trường thay vì viết cứng
    const response = await authApi.login(
      process.env.TEST_USERNAME || '',
      process.env.TEST_PASSWORD || ''
    );

    // Đăng nhập đúng thông tin -> Mong đợi status 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Đảm bảo nhận về token dạng string và không rỗng
    expect(typeof body.token).toBe('string');
    expect(body.token).not.toBe('');
  });

  test('POST /login - Đăng nhập thất bại khi sai mật khẩu', async ({ request }) => {
    const authApi = new AuthApi(request);
    // Gửi đúng username nhưng sai mật khẩu
    const response = await authApi.login(
      process.env.TEST_USERNAME || '',
      'wrong_password'
    );

    // Mong đợi lỗi 401 Unauthorized
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.message).toBe('Tai khoan hoac mat khau khong dung');
  });

  // =======================================================
  // 2. KIỂM THỬ BẢO MẬT API (AUTHORIZATION)
  // =======================================================

  test('GET /todos - Bị từ chối truy cập khi không gửi Token', async ({ request }) => {
    // Khởi tạo TodoApi nhưng truyền Token rỗng để không gửi token
    const todoApi = new TodoApi(request, '');

    const response = await todoApi.getTodos();

    // Chưa đăng nhập -> Mong đợi lỗi 401 Unauthorized
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.message).toBe('Yeu cau dang nhap de truy cap tai nguyen nay');
  });

  test('GET /todos - Bị từ chối truy cập khi gửi Token sai', async ({ request }) => {
    // Truyền Token sai/không hợp lệ
    const todoApi = new TodoApi(request, 'invalid-token-value-123');

    const response = await todoApi.getTodos();

    // Token sai -> Mong đợi lỗi 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  // =======================================================
  // 3. ĐĂNG NHẬP LẤY TOKEN ĐỂ GỌI API THÀNH CÔNG
  // =======================================================

  test('GET /todos - Truy cập thành công khi gửi Token hợp lệ', async ({ request }) => {
    const authApi = new AuthApi(request);

    // Bước 1: Đăng nhập để lấy token từ biến môi trường
    const loginResponse = await authApi.login(
      process.env.TEST_USERNAME || '',
      process.env.TEST_PASSWORD || ''
    );
    expect(loginResponse.status()).toBe(200);
    const loginBody = await loginResponse.json();
    const token = loginBody.token;

    // Bước 2: Khởi tạo TodoApi và đính kèm token vừa lấy được
    const todoApi = new TodoApi(request, token);

    // Bước 3: Gửi request lấy todos
    const response = await todoApi.getTodos();

    // Có token hợp lệ -> Mong đợi truy cập thành công 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json();
    TodoArraySchema.parse(body);
  });
});

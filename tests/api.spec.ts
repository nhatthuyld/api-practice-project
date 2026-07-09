import { test, expect } from '@playwright/test';
import { TodoApi } from '../src/api/TodoApi';
import { TodoSchema, TodoArraySchema } from '../src/models/todo.schema';
import { faker } from '@faker-js/faker'; // Import thư viện Faker để sinh dữ liệu ngẫu nhiên

test.describe('API Practice - Todo REST API (Enterprise Refactored)', () => {

  // ==========================================
  // TEST CASE 1: Lấy danh sách toàn bộ Todos
  // ==========================================
  test('GET /todos - Should retrieve all default todos', async ({ request }) => {
    // 1. Khởi tạo đối tượng TodoApi. Nhờ Global Setup, Token sẽ tự động được đính kèm!
    const todoApi = new TodoApi(request);

    // 2. Gửi request GET tới /api/todos thông qua helper TodoApi
    const response = await todoApi.getTodos();

    // 3. Kiểm tra mã trạng thái trả về (Status Code) phải là 200 (Thành công)
    expect(response.status()).toBe(200);

    // 4. Giải nén dữ liệu trả về từ server thành dạng JSON
    const body = await response.json();

    // 5. [SCHEMA VALIDATION]: So khớp dữ liệu body nhận về với cấu trúc mảng đã định nghĩa sẵn
    const parsed = TodoArraySchema.safeParse(body);

    // 6. Khẳng định rằng việc so khớp cấu trúc dữ liệu phải THÀNH CÔNG
    expect(parsed.success).toBe(true);

    // 7. Nếu cấu trúc đúng, tiến hành kiểm tra sâu hơn vào nội dung dữ liệu
    if (parsed.success) {
      expect(parsed.data.length).toBeGreaterThanOrEqual(3);
    }
  });

  // ==========================================
  // TEST CASE 2: Tạo mới một Todo
  // ==========================================
  test('POST /todos - Should create a new todo', async ({ request }) => {
    const todoApi = new TodoApi(request);
    // Sinh ngẫu nhiên một câu văn làm tiêu đề Todo
    const randomTitle = faker.lorem.sentence(); 

    // 1. Gửi request POST tạo Todo mới với tiêu đề ngẫu nhiên
    const response = await todoApi.createTodo(randomTitle);
    expect(response.status()).toBe(201);

    const body = await response.json();

    // 2. [SCHEMA VALIDATION]: Xác thực cấu trúc của Todo đơn lẻ mới tạo
    const parsed = TodoSchema.safeParse(body);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      // 3. So sánh dữ liệu thực tế nhận về có trùng khớp với tiêu đề ngẫu nhiên đã gửi không
      expect(parsed.data.title).toBe(randomTitle);
      expect(parsed.data.completed).toBe(false);

      // 4. [DỌN DẸP DỮ LIỆU]: Sau khi test tạo thành công, ta xóa Todo này đi
      await todoApi.deleteTodo(parsed.data.id);
    }
  });

  // ==========================================
  // TEST CASE 3: Lấy chi tiết Todo theo ID
  // ==========================================
  test('GET /todos/:id - Should retrieve the specific todo', async ({ request }) => {
    const todoApi = new TodoApi(request);
    // Sinh ngẫu nhiên 3 từ đại diện cho tiêu đề
    const randomTitle = `GET test - ${faker.lorem.words(3)}`;

    // 1. [CHUẨN BỊ]: Tạo mới một Todo mẫu và lấy ID (Rút gọn nhờ helper)
    const targetId = await todoApi.createTodoAndGetId(randomTitle);

    // 2. [THỰC HIỆN TEST]: Gọi API GET chi tiết dựa trên ID vừa tạo ở trên
    const response = await todoApi.getTodoById(targetId);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const parsed = TodoSchema.safeParse(body);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.id).toBe(targetId);
      expect(parsed.data.title).toBe(randomTitle);
    }

    // 3. [DỌN DẸP]: Xóa Todo mẫu đi để trả database về trạng thái cũ
    await todoApi.deleteTodo(targetId);
  });

  // ==========================================
  // TEST CASE 4: Cập nhật Todo (Sửa thông tin)
  // ==========================================
  test('PUT /todos/:id - Should update the todo status to completed', async ({ request }) => {
    const todoApi = new TodoApi(request);

    // 1. [CHUẨN BỊ]: Tạo mới một Todo mẫu và lấy ID (Rút gọn nhờ helper)
    const targetId = await todoApi.createTodoAndGetId('Todo de test UPDATE');

    // 2. [THỰC HIỆN TEST]: Sửa Todo (Đổi trạng thái completed = true và sửa title)
    const response = await todoApi.updateTodo(targetId, {
      completed: true,
      title: 'Todo de test UPDATE (Da hoan thanh)'
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const parsed = TodoSchema.safeParse(body);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.id).toBe(targetId);
      expect(parsed.data.title).toBe('Todo de test UPDATE (Da hoan thanh)');
      expect(parsed.data.completed).toBe(true);
    }

    // 3. [DỌN DẸP]: Xóa Todo mẫu sau khi test xong
    await todoApi.deleteTodo(targetId);
  });

  // ==========================================
  // TEST CASE 5: Xóa Todo thành công
  // ==========================================
  test('DELETE /todos/:id - Should delete the todo', async ({ request }) => {
    const todoApi = new TodoApi(request);

    // 1. [CHUẨN BỊ]: Tạo mới một Todo mẫu và lấy ID (Rút gọn nhờ helper)
    const targetId = await todoApi.createTodoAndGetId('Todo de test DELETE');

    // 2. [THỰC HIỆN TEST]: Gửi yêu cầu xóa Todo theo ID
    const deleteResponse = await todoApi.deleteTodo(targetId);
    expect(deleteResponse.status()).toBe(200);

    const deleteBody = await deleteResponse.json();
    expect(deleteBody.message).toBe('Xoa cong viec thanh cong');

    // 3. [KIỂM TRA LẠI]: Chắc chắn Todo đã bị xóa (GET trả về 404)
    const getResponse = await todoApi.getTodoById(targetId);
    expect(getResponse.status()).toBe(404);
  });

  // ==========================================
  // TEST CASE 6: Tạo Todo thất bại do thiếu tiêu đề
  // ==========================================
  test('POST /todos - Should fail if title is empty', async ({ request }) => {
    const todoApi = new TodoApi(request);
    
    // Gửi request POST tạo mới với title rỗng ""
    const response = await todoApi.createTodo('');
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toBe('Tieu de cong viec khong duoc de trong');
  });

  // =======================================================
  // --- CÁC TEST CASE KIỂM THỬ LỖI (NEGATIVE CASES) ---
  // =======================================================

  test('GET /todos/:id - Should fail if todo does not exist (404)', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.getTodoById(9999);
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe('Khong tim thay cong viec voi id 9999');
  });

  test('PUT /todos/:id - Should fail if todo does not exist (404)', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.updateTodo(9999, {
      title: 'Sua cong viec khong ton tai'
    });
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe('Khong tim thay cong viec voi id 9999');
  });

  test('PUT /todos/:id - Should fail if title is empty (400)', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.updateTodo(1, {
      title: ''
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toBe('Tieu de cong viec khong duoc de trong');
  });

  test('DELETE /todos/:id - Should fail if todo does not exist (404)', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.deleteTodo(9999);
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe('Khong tim thay cong viec voi id 9999');
  });
});

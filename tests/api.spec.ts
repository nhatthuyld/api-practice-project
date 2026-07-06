import { test, expect } from '@playwright/test';
import { TodoApi } from '../src/api/TodoApi';
import { TodoSchema, TodoArraySchema } from '../src/models/todo.schema';

test.describe('API Practice - Todo REST API (Enterprise Refactored)', () => {

  // ==========================================
  // TEST CASE 1: Lấy danh sách toàn bộ Todos
  // ==========================================
  test('GET /todos - Should retrieve all default todos', async ({ request }) => {
    // 1. Khởi tạo đối tượng TodoApi, truyền vào request context của Playwright
    const todoApi = new TodoApi(request);

    // 2. Gửi request GET tới /api/todos thông qua helper TodoApi
    const response = await todoApi.getTodos();

    // 3. Kiểm tra mã trạng thái trả về (Status Code) phải là 200 (Thành công)
    expect(response.status()).toBe(200);

    // 4. Giải nén dữ liệu trả về từ server thành dạng JSON
    const body = await response.json();

    // 5. [SCHEMA VALIDATION]: So khớp dữ liệu body nhận về với cấu trúc mảng đã định nghĩa sẵn
    // safeParse() trả về object có thuộc tính 'success' (true/false) và 'data' (nếu khớp thành công)
    const parsed = TodoArraySchema.safeParse(body);

    // 6. Khẳng định rằng việc so khớp cấu trúc dữ liệu phải THÀNH CÔNG
    expect(parsed.success).toBe(true);

    // 7. Nếu cấu trúc đúng, tiến hành kiểm tra sâu hơn vào nội dung dữ liệu
    if (parsed.success) {
      // parsed.data chính là mảng Todos đã được kiểm chứng kiểu dữ liệu.
      // Kiểm tra xem danh sách trả về có ít nhất 3 Todo mặc định hay không.
      expect(parsed.data.length).toBeGreaterThanOrEqual(3);
    }
  });

  // ==========================================
  // TEST CASE 2: Tạo mới một Todo
  // ==========================================
  test('POST /todos - Should create a new todo', async ({ request }) => {
    const todoApi = new TodoApi(request);

    // 1. Gửi request POST tạo Todo mới với tiêu đề truyền vào
    const response = await todoApi.createTodo('Viet test API tu dong voi Playwright');
    expect(response.status()).toBe(201); // 201: Đã tạo thành công (Created)

    const body = await response.json();

    // 2. [SCHEMA VALIDATION]: Xác thực cấu trúc của Todo đơn lẻ mới tạo
    const parsed = TodoSchema.safeParse(body);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      // 3. So sánh dữ liệu thực tế trong Todo xem có đúng với thông tin ta vừa gửi lên không
      expect(parsed.data.title).toBe('Viet test API tu dong voi Playwright');
      expect(parsed.data.completed).toBe(false); // Mặc định Todo mới tạo completed phải là false

      // 4. [DỌN DẸP DỮ LIỆU]: Sau khi test tạo thành công, ta xóa Todo này đi
      // Điều này giúp database ảo luôn sạch và không làm ảnh hưởng các test case khác
      await todoApi.deleteTodo(parsed.data.id);
    }
  });

  // ==========================================
  // TEST CASE 3: Lấy chi tiết Todo theo ID
  // ==========================================
  test('GET /todos/:id - Should retrieve the specific todo', async ({ request }) => {
    const todoApi = new TodoApi(request);

    // 1. [CHUẨN BỊ]: Tạo mới một Todo mẫu và lấy ID (Rút gọn nhờ helper)
    const targetId = await todoApi.createTodoAndGetId('Todo cho test GET chi tiet');

    // 2. [THỰC HIỆN TEST]: Gọi API GET chi tiết dựa trên ID vừa tạo ở trên
    const response = await todoApi.getTodoById(targetId);
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Validate cấu trúc Todo nhận về
    const parsed = TodoSchema.safeParse(body);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      // Kiểm tra xem thông tin lấy ra có khớp với ID và tiêu đề đã tạo không
      expect(parsed.data.id).toBe(targetId);
      expect(parsed.data.title).toBe('Todo cho test GET chi tiet');
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
    // Validate cấu trúc Todo nhận về sau khi sửa
    const parsed = TodoSchema.safeParse(body);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      // Xác nhận xem thông tin thay đổi đã được lưu thành công chưa
      expect(parsed.data.id).toBe(targetId);
      expect(parsed.data.title).toBe('Todo de test UPDATE (Da hoan thanh)');
      expect(parsed.data.completed).toBe(true); // Trạng thái phải đổi thành true
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
    // Xác nhận server trả về thông báo xóa thành công
    expect(deleteBody.message).toBe('Xoa cong viec thanh cong');

    // 3. [KIỂM TRA LẠI]: Để chắc chắn Todo thực sự đã biến mất,
    // ta gọi API GET chi tiết ID đó. Kết quả mong đợi phải là 404 (Không tìm thấy).
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
    expect(response.status()).toBe(400); // 400: Yêu cầu không hợp lệ (Bad Request)

    const body = await response.json();
    // Xác nhận thông báo lỗi từ server gửi về đúng như quy ước
    expect(body.message).toBe('Tieu de cong viec khong duoc de trong');
  });

  // =======================================================
  // --- CÁC TEST CASE KIỂM THỬ LỖI (NEGATIVE CASES) ---
  // =======================================================

  // Test lấy chi tiết ID không tồn tại
  test('GET /todos/:id - Should fail if todo does not exist (404)', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.getTodoById(9999); // ID 9999 không tồn tại
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe('Khong tim thay cong viec voi id 9999');
  });

  // Test sửa ID không tồn tại
  test('PUT /todos/:id - Should fail if todo does not exist (404)', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.updateTodo(9999, {
      title: 'Sua cong viec khong ton tai'
    });
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe('Khong tim thay cong viec voi id 9999');
  });

  // Test sửa Todo đang tồn tại (ví dụ ID 1) nhưng truyền title rỗng
  test('PUT /todos/:id - Should fail if title is empty (400)', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.updateTodo(1, {
      title: '' // Tiêu đề rỗng
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toBe('Tieu de cong viec khong duoc de trong');
  });

  // Test xóa ID không tồn tại
  test('DELETE /todos/:id - Should fail if todo does not exist (404)', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.deleteTodo(9999); // ID 9999 không tồn tại
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe('Khong tim thay cong viec voi id 9999');
  });
});

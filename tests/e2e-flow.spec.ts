import { test, expect } from '@playwright/test';
import { TodoApi } from '../src/api/TodoApi';
import { TodoSchema } from '../src/models/todo.schema';
import { faker } from '@faker-js/faker';

test.describe('API Chaining - Kịch bản kiểm thử Todo E2E', () => {

  test('Kiểm thử trọn vẹn chu kỳ Todo (Tạo -> Xem -> Sửa -> Xóa -> Xác minh)', async ({ request }) => {
    // Khởi tạo TodoApi (Token tự động đính kèm nhờ Global Setup)
    const todoApi = new TodoApi(request);
    
    // Sinh tiêu đề Todo ngẫu nhiên bằng Faker
    const todoTitle = `E2E Task - ${faker.hacker.verb()} ${faker.hacker.noun()}`;

    console.log(`🚀 Bắt đầu chạy luồng E2E cho Todo: "${todoTitle}"`);

    // =========================================================================
    // BƯỚC 1: TẠO MỚI TODO (POST)
    // =========================================================================
    const createResponse = await todoApi.createTodo(todoTitle);
    expect(createResponse.status()).toBe(201);
    
    const createdBody = await createResponse.json();
    const todoId = createdBody.id; // 🔑 LẤY ID ĐỂ LÀM ĐẦU VÀO CHO CÁC BƯỚC SAU
    console.log(`[Bước 1] Đã tạo Todo thành công. ID = ${todoId}`);

    // =========================================================================
    // BƯỚC 2: XEM CHI TIẾT TODO VỪA TẠO (GET /:id)
    // =========================================================================
    const getResponse = await todoApi.getTodoById(todoId);
    expect(getResponse.status()).toBe(200);

    const getBody = await getResponse.json();
    // Xác thực Schema
    const parsedGet = TodoSchema.safeParse(getBody);
    expect(parsedGet.success).toBe(true);

    if (parsedGet.success) {
      expect(parsedGet.data.id).toBe(todoId);
      expect(parsedGet.data.title).toBe(todoTitle);
      expect(parsedGet.data.completed).toBe(false); // Mới tạo phải là false
      console.log(`[Bước 2] Đã xem chi tiết Todo ID = ${todoId}. Dữ liệu chính xác!`);
    }

    // =========================================================================
    // BƯỚC 3: CẬP NHẬT TRẠNG THÁI TODO (PUT /:id)
    // =========================================================================
    const updatedTitle = `${todoTitle} (Đã hoàn thành)`;
    const updateResponse = await todoApi.updateTodo(todoId, {
      completed: true,
      title: updatedTitle
    });
    expect(updateResponse.status()).toBe(200);

    const updateBody = await updateResponse.json();
    const parsedUpdate = TodoSchema.safeParse(updateBody);
    expect(parsedUpdate.success).toBe(true);

    if (parsedUpdate.success) {
      expect(parsedUpdate.data.id).toBe(todoId);
      expect(parsedUpdate.data.title).toBe(updatedTitle);
      expect(parsedUpdate.data.completed).toBe(true); // Trạng thái đã chuyển sang true
      console.log(`[Bước 3] Đã cập nhật Todo ID = ${todoId} sang trạng thái Completed`);
    }

    // =========================================================================
    // BƯỚC 4: XÓA TODO (DELETE /:id)
    // =========================================================================
    const deleteResponse = await todoApi.deleteTodo(todoId);
    expect(deleteResponse.status()).toBe(200);
    
    const deleteBody = await deleteResponse.json();
    expect(deleteBody.message).toBe('Xoa cong viec thanh cong');
    console.log(`[Bước 4] Đã xóa Todo ID = ${todoId}`);

    // =========================================================================
    // BƯỚC 5: XÁC MINH TODO ĐÃ BỊ XÓA HOÀN TOÀN (GET /:id -> 404)
    // =========================================================================
    const verifyResponse = await todoApi.getTodoById(todoId);
    // Mong đợi nhận lỗi 404 vì Todo đã bị xóa ở bước 4
    expect(verifyResponse.status()).toBe(404);
    console.log(`[Bước 5] Xác minh Todo ID = ${todoId} không còn tồn tại trên server (404 OK)`);
    
    console.log('✅ Hoàn thành luồng E2E thành công tốt đẹp!');
  });
});

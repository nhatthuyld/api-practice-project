import { test, expect } from '@playwright/test';
import { TodoApi } from '../src/api/TodoApi';
import { TodoSchema, TodoArraySchema } from '../src/models/todo.schema';

test.describe('API Practice - Todo REST API (Enterprise Refactored)', () => {

  test('GET /todos - Should retrieve all default todos', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.getTodos();
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Validate schema
    const parsed = TodoArraySchema.safeParse(body);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('POST /todos - Should create a new todo', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.createTodo('Viet test API tu dong voi Playwright');
    expect(response.status()).toBe(201);

    const body = await response.json();
    // Validate schema
    const parsed = TodoSchema.safeParse(body);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.title).toBe('Viet test API tu dong voi Playwright');
      expect(parsed.data.completed).toBe(false);

      // Clean up after test
      await todoApi.deleteTodo(parsed.data.id);
    }
  });

  test('GET /todos/:id - Should retrieve the specific todo', async ({ request }) => {
    const todoApi = new TodoApi(request);

    // 1. CHUẨN BỊ: Tạo mới một Todo riêng cho test này
    const postResponse = await todoApi.createTodo('Todo cho test GET chi tiet');
    const newTodo = await postResponse.json();
    const targetId = newTodo.id;

    // 2. THỰC HIỆN TEST: Gọi GET chi tiết theo ID vừa tạo
    const response = await todoApi.getTodoById(targetId);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const parsed = TodoSchema.safeParse(body);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.id).toBe(targetId);
      expect(parsed.data.title).toBe('Todo cho test GET chi tiet');
    }

    // 3. DỌN DẸP: Xóa Todo sau khi test xong
    await todoApi.deleteTodo(targetId);
  });

  test('PUT /todos/:id - Should update the todo status to completed', async ({ request }) => {
    const todoApi = new TodoApi(request);

    // 1. CHUẨN BỊ: Tạo mới một Todo
    const postResponse = await todoApi.createTodo('Todo de test UPDATE');
    const newTodo = await postResponse.json();
    const targetId = newTodo.id;

    // 2. THỰC HIỆN TEST: Cập nhật Todo
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

    // 3. DỌN DẸP: Xóa Todo
    await todoApi.deleteTodo(targetId);
  });

  test('DELETE /todos/:id - Should delete the todo', async ({ request }) => {
    const todoApi = new TodoApi(request);

    // 1. CHUẨN BỊ: Tạo mới một Todo
    const postResponse = await todoApi.createTodo('Todo de test DELETE');
    const newTodo = await postResponse.json();
    const targetId = newTodo.id;

    // 2. THỰC HIỆN TEST: Xóa Todo
    const deleteResponse = await todoApi.deleteTodo(targetId);
    expect(deleteResponse.status()).toBe(200);

    const deleteBody = await deleteResponse.json();
    expect(deleteBody.message).toBe('Xoa cong viec thanh cong');

    // 3. KIỂM TRA LẠI: Chắc chắn Todo đã bị xóa (GET trả về 404)
    const getResponse = await todoApi.getTodoById(targetId);
    expect(getResponse.status()).toBe(404);
  });

  test('POST /todos - Should fail if title is empty', async ({ request }) => {
    const todoApi = new TodoApi(request);
    const response = await todoApi.createTodo('');
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toBe('Tieu de cong viec khong duoc de trong');
  });

  // --- CÁC TEST CASE LỖI (NEGATIVE CASES) ---

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

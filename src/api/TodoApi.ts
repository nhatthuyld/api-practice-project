import { APIRequestContext } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class TodoApi extends BaseApi {
  constructor(request: APIRequestContext, token?: string) {
    super(request, token);
  }

  async getTodos() {
    return await this.request.get('/api/todos', {
      headers: this.getHeaders()
    });
  }

  async getTodoById(id: number | string) {
    return await this.request.get(`/api/todos/${id}`, {
      headers: this.getHeaders()
    });
  }

  async createTodo(title: string) {
    return await this.request.post('/api/todos', {
      data: { title },
      headers: this.getHeaders()
    });
  }

  async updateTodo(id: number | string, data: { title?: string; completed?: boolean }) {
    return await this.request.put(`/api/todos/${id}`, {
      data,
      headers: this.getHeaders()
    });
  }

  async deleteTodo(id: number | string) {
    return await this.request.delete(`/api/todos/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Hàm helper rút gọn: Tạo Todo mới và trả về ngay ID
  async createTodoAndGetId(title: string): Promise<number> {
    const response = await this.createTodo(title);
    const body = await response.json();
    return body.id;
  }
}

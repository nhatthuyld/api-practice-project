import { APIRequestContext } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class TodoApi extends BaseApi {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async getTodos() {
    return await this.request.get('/api/todos');
  }

  async getTodoById(id: number | string) {
    return await this.request.get(`/api/todos/${id}`);
  }

  async createTodo(title: string) {
    return await this.request.post('/api/todos', {
      data: { title }
    });
  }

  async updateTodo(id: number | string, data: { title?: string; completed?: boolean }) {
    return await this.request.put(`/api/todos/${id}`, {
      data
    });
  }

  async deleteTodo(id: number | string) {
    return await this.request.delete(`/api/todos/${id}`);
  }
}

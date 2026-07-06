const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Database in memory
let todos = [
  { id: 1, title: 'Hoc ly thuyet HTTP & REST API', completed: true },
  { id: 2, title: 'Xay dung API Server voi Express', completed: false },
  { id: 3, title: 'Viet test API voi Playwright', completed: false }
];

// Helper to find todo
const findTodo = (id) => todos.find(t => t.id === parseInt(id));

// 1. GET /api/todos - Lấy danh sách công việc
app.get('/api/todos', (req, res) => {
  res.status(200).json(todos);
});

// 2. GET /api/todos/:id - Lấy chi tiết công việc
app.get('/api/todos/:id', (req, res) => {
  const todo = findTodo(req.params.id);
  if (!todo) {
    return res.status(404).json({ message: `Khong tim thay cong viec voi id ${req.params.id}` });
  }
  res.status(200).json(todo);
});

// 3. POST /api/todos - Tạo mới công việc
app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Tieu de cong viec khong duoc de trong' });
  }
  
  const newTodo = {
    id: todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1,
    title: title.trim(),
    completed: false
  };
  
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// 4. PUT /api/todos/:id - Cập nhật công việc
app.put('/api/todos/:id', (req, res) => {
  const todo = findTodo(req.params.id);
  if (!todo) {
    return res.status(404).json({ message: `Khong tim thay cong viec voi id ${req.params.id}` });
  }

  const { title, completed } = req.body;
  if (title !== undefined) {
    if (title.trim() === '') {
      return res.status(400).json({ message: 'Tieu de cong viec khong duoc de trong' });
    }
    todo.title = title.trim();
  }
  if (completed !== undefined) {
    todo.completed = !!completed;
  }

  res.status(200).json(todo);
});

// 5. DELETE /api/todos/:id - Xóa công việc
app.delete('/api/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: `Khong tim thay cong viec voi id ${req.params.id}` });
  }

  const deletedTodo = todos.splice(index, 1);
  res.status(200).json({ message: 'Xoa cong viec thanh cong', data: deletedTodo[0] });
});

// Start server
app.listen(PORT, () => {
  console.log(`[API Server] Server dang chay tai http://localhost:${PORT}`);
  console.log(`[API Server] GET tat ca Todos: http://localhost:${PORT}/api/todos`);
});

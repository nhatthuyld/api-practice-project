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

// Token tĩnh phục vụ cho việc thực hành test Auth
const MOCK_TOKEN = 'mock-jwt-token-xyz123';

// 1. API Đăng nhập - POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Tài khoản mật khẩu test mặc định
  if (username === 'admin' && password === 'password123') {
    return res.status(200).json({ token: MOCK_TOKEN });
  }
  
  return res.status(401).json({ message: 'Tai khoan hoac mat khau khong dung' });
});

// Middleware xác thực Token (Chốt chặn bảo vệ các API phía dưới)
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Kiểm tra xem header Authorization có đúng định dạng "Bearer mock-jwt-token-xyz123" không
  if (authHeader && authHeader === `Bearer ${MOCK_TOKEN}`) {
    return next(); // Token hợp lệ, cho phép đi tiếp
  }
  
  // Trả về lỗi 401 Unauthorized nếu không có token hoặc token sai
  return res.status(401).json({ message: 'Yeu cau dang nhap de truy cap tai nguyen nay' });
};

// Helper to find todo
const findTodo = (id) => todos.find(t => t.id === parseInt(id));

// Áp dụng authMiddleware cho toàn bộ các API Todos phía dưới
app.use('/api/todos', authMiddleware);

// 1. GET /api/todos - Lấy danh sách công việc (đã được bảo vệ bởi middleware)
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

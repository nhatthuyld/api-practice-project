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

// ==========================================
// E-COMMERCE MOCK DATABASE & APIS
// ==========================================

// Mock Databases
let products = [
  { id: 1, name: 'iPhone 15 Pro Max', price: 1200, stock: 10, description: 'Chiec dien thoai cao cap nhat cua Apple' },
  { id: 2, name: 'MacBook Pro M3 Max', price: 3200, stock: 5, description: 'May tinh xach tay sieu manh me cho lap trinh vien' },
  { id: 3, name: 'Tai nghe AirPods Pro 2', price: 250, stock: 15, description: 'Tai nghe chong on chu dong tot nhat hien tai' }
];

let cart = {
  items: [] // Moi phan tu co dang: { productId: number, quantity: number }
};

let orders = [];

// Helper tim kiem san pham
const findProduct = (id) => products.find(p => p.id === parseInt(id));

// 1. GET /api/products - Lay danh sach tat ca san pham (Khong can Auth)
app.get('/api/products', (req, res) => {
  res.status(200).json(products);
});

// 2. GET /api/products/:id - Lay chi tiet san pham (Khong can Auth)
app.get('/api/products/:id', (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Khong tim thay san pham' });
  }
  res.status(200).json(product);
});

// Cac API gio hang va thanh toan yeu cau bao ve boi authMiddleware
app.use('/api/cart', authMiddleware);
app.use('/api/orders', authMiddleware);

// 3. GET /api/cart - Xem gio hang hien tai
app.get('/api/cart', (req, res) => {
  let totalCartAmount = 0;
  const itemsWithDetails = cart.items.map(item => {
    const product = findProduct(item.productId);
    const itemTotal = product ? product.price * item.quantity : 0;
    totalCartAmount += itemTotal;
    return {
      product,
      quantity: item.quantity,
      itemTotal
    };
  });

  res.status(200).json({
    items: itemsWithDetails,
    totalCartAmount
  });
});

// 4. POST /api/cart - Them san pham vao gio hang
app.post('/api/cart', (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Thong tin san pham hoac so luong khong hop le' });
  }

  const product = findProduct(productId);
  if (!product) {
    return res.status(404).json({ message: 'Khong tim thay san pham' });
  }

  // Kiem tra ton kho (stock)
  if (product.stock < quantity) {
    return res.status(400).json({ message: `San pham chi con ${product.stock} san pham trong kho` });
  }

  // Kiem tra xem san pham da co trong gio hang chua
  const existingItem = cart.items.find(item => item.productId === parseInt(productId));
  if (existingItem) {
    if (product.stock < existingItem.quantity + quantity) {
      return res.status(400).json({ message: `Khong the them vi vuot qua so luong ton kho (${product.stock})` });
    }
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ productId: parseInt(productId), quantity: parseInt(quantity) });
  }

  res.status(200).json({ message: 'Da them san pham vao gio hang thanh cong', cart });
});

// 5. POST /api/orders - Dat hang tu gio hang hien tai
app.post('/api/orders', (req, res) => {
  if (cart.items.length === 0) {
    return res.status(400).json({ message: 'Gio hang cua ban dang trong, khong the dat hang' });
  }

  let orderTotal = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = findProduct(item.productId);
    if (!product || product.stock < item.quantity) {
      return res.status(400).json({ 
        message: `Dat hang that bai. San pham ${product ? product.name : 'ID ' + item.productId} khong du hang hoac da het` 
      });
    }
    
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      itemTotal: product.price * item.quantity
    });
    orderTotal += product.price * item.quantity;
  }

  // Tru kho (stock) cua tung san pham thực te sau khi check OK
  for (const item of cart.items) {
    const product = findProduct(item.productId);
    product.stock -= item.quantity;
  }

  // Tao don hang moi
  const newOrder = {
    id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 10001,
    items: orderItems,
    totalAmount: orderTotal,
    status: 'completed',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);

  // Reset gio hang ve rong
  cart.items = [];

  res.status(201).json({
    message: 'Dat hang thanh cong',
    order: newOrder
  });
});

// 6. GET /api/orders - Xem danh sach don hang da dat
app.get('/api/orders', (req, res) => {
  res.status(200).json(orders);
});

// Start server
app.listen(PORT, () => {
  console.log(`[API Server] Server dang chay tai http://localhost:${PORT}`);
  console.log(`[API Server] GET tat ca Todos: http://localhost:${PORT}/api/todos`);
});

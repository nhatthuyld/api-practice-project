import { test, expect } from '@playwright/test';
import { ProductApi } from '../src/api/ProductApi';
import { CartApi } from '../src/api/CartApi';
import { OrderApi } from '../src/api/OrderApi';
import { ProductArraySchema, ProductSchema, CartSchema, OrderSchema } from '../src/models/ecommerce.schema';

test.describe('E-commerce API Integration & E2E Purchase Flow', () => {

  test('Kịch bản E2E: Xem Sản phẩm -> Thêm Giỏ hàng -> Đặt hàng -> Xác minh Stock & Đơn hàng', async ({ request }) => {
    // Khởi tạo các API client wrappers (Token tự động load từ file auth.json nhờ global setup)
    const productApi = new ProductApi(request);
    const cartApi = new CartApi(request);
    const orderApi = new OrderApi(request);

    console.log('🛍️ BẮT ĐẦU LUỒNG KIỂM THỬ MUA HÀNG E2E');

    // ==========================================
    // BƯỚC 1: XEM DANH SÁCH SẢN PHẨM & CHỌN MUA
    // ==========================================
    const productsResponse = await productApi.getProducts();
    expect(productsResponse.status()).toBe(200);

    const productsBody = await productsResponse.json();
    const productList = ProductArraySchema.parse(productsBody);
    
    // Đảm bảo hệ thống có sản phẩm mẫu
    expect(productList.length).toBeGreaterThan(0);
    
    // Chọn sản phẩm đầu tiên làm mục tiêu mua sắm (iPhone 15 Pro Max)
    const targetProduct = productList[0];
    const initialStock = targetProduct.stock;
    const purchaseQty = 2; // Số lượng muốn mua

    console.log(`[Bước 1] Chọn sản phẩm: "${targetProduct.name}" | Giá: $${targetProduct.price} | Tồn kho gốc: ${initialStock}`);
    expect(initialStock).toBeGreaterThanOrEqual(purchaseQty);

    // ==========================================
    // BƯỚC 2: THÊM SẢN PHẨM VÀO GIỎ HÀNG (POST /api/cart)
    // ==========================================
    console.log(`[Bước 2] Thêm ${purchaseQty} sản phẩm "${targetProduct.name}" vào giỏ hàng`);
    const addToCartResponse = await cartApi.addToCart(targetProduct.id, purchaseQty);
    expect(addToCartResponse.status()).toBe(200);

    const addToCartBody = await addToCartResponse.json();
    expect(addToCartBody.message).toBe('Da them san pham vao gio hang thanh cong');

    // ==========================================
    // BƯỚC 3: XEM CHI TIẾT GIỎ HÀNG ĐỂ XÁC MINH (GET /api/cart)
    // ==========================================
    console.log(`[Bước 3] Kiểm tra giỏ hàng để xác nhận số lượng và tổng tiền`);
    const cartResponse = await cartApi.getCart();
    expect(cartResponse.status()).toBe(200);

    const cartBody = await cartResponse.json();
    const cartData = CartSchema.parse(cartBody);

    // Xác minh giỏ hàng chứa đúng sản phẩm mục tiêu và số lượng mua
    const cartItem = cartData.items.find(item => item.product.id === targetProduct.id);
    expect(cartItem).toBeDefined();
    expect(cartItem?.quantity).toBe(purchaseQty);

    // Xác minh tổng tiền của giỏ hàng
    const expectedTotal = targetProduct.price * purchaseQty;
    expect(cartData.totalCartAmount).toBe(expectedTotal);
    expect(cartItem?.itemTotal).toBe(expectedTotal);
    console.log(`[Bước 3] Giỏ hàng hợp lệ! Tổng tiền tạm tính: $${cartData.totalCartAmount}`);

    // ==========================================
    // BƯỚC 4: TIẾN HÀNH ĐẶT HÀNG (POST /api/orders)
    // ==========================================
    console.log(`[Bước 4] Tiến hành thanh toán và tạo đơn hàng`);
    const orderResponse = await orderApi.createOrder();
    expect(orderResponse.status()).toBe(201);

    const orderBody = await orderResponse.json();
    expect(orderBody.message).toBe('Dat hang thanh cong');

    const orderData = OrderSchema.parse(orderBody.order);
    expect(orderData.totalAmount).toBe(expectedTotal);
    expect(orderData.status).toBe('completed');
    expect(orderData.items.length).toBe(1);
    expect(orderData.items[0].productId).toBe(targetProduct.id);
    expect(orderData.items[0].quantity).toBe(purchaseQty);
    console.log(`[Bước 4] Tạo đơn hàng thành công! Mã đơn hàng: ${orderData.id}`);

    // ==========================================
    // BƯỚC 5: XÁC MINH CẬP NHẬT TỒN KHO & GIỎ HÀNG TRỐNG
    // ==========================================
    console.log(`[Bước 5] Xác minh tồn kho sản phẩm đã giảm và giỏ hàng đã được dọn trống`);
    
    // 5.1. Xem lại sản phẩm để kiểm tra số lượng tồn kho mới
    const targetProductResponse = await productApi.getProductById(targetProduct.id);
    expect(targetProductResponse.status()).toBe(200);
    const targetProductBody = await targetProductResponse.json();
    const updatedProduct = ProductSchema.parse(targetProductBody);
    
    const expectedStock = initialStock - purchaseQty;
    expect(updatedProduct.stock).toBe(expectedStock);
    console.log(`[Xác minh 5.1] Tồn kho của "${targetProduct.name}" từ ${initialStock} giảm xuống còn ${updatedProduct.stock} (Chính xác!)`);

    // 5.2. Xem giỏ hàng mới để đảm bảo đã bị reset về rỗng
    const finalCartResponse = await cartApi.getCart();
    expect(finalCartResponse.status()).toBe(200);
    const finalCartBody = await finalCartResponse.json();
    const finalCartData = CartSchema.parse(finalCartBody);
    expect(finalCartData.items.length).toBe(0);
    expect(finalCartData.totalCartAmount).toBe(0);
    console.log(`[Xác minh 5.2] Giỏ hàng đã được reset trống hoàn toàn sau khi đặt hàng.`);

    console.log('✅ HOÀN THÀNH LUỒNG MUA HÀNG E2E THÀNH CÔNG RỰC RỠ!');
  });
});

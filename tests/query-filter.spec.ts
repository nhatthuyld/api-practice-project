import { test, expect } from '@playwright/test';
import { ProductApi } from '../src/api/ProductApi';
import { ProductArraySchema } from '../src/models/ecommerce.schema';

test.describe('Query Parameters - Kiểm thử Tìm kiếm & Lọc sản phẩm (GET /api/products)', () => {
  let productApi: ProductApi;

  test.beforeEach(async ({ request }) => {
    productApi = new ProductApi(request);
  });

  // 1. Test lọc theo từ khóa tìm kiếm (search)
  test('Nên lọc sản phẩm theo từ khóa tìm kiếm (search = "iPhone")', async () => {
    const response = await productApi.getProducts({ search: 'iPhone' });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const products = ProductArraySchema.parse(body);

    // Xác nhận danh sách không rỗng và tất cả sản phẩm đều chứa chữ "iPhone"
    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      expect(product.name.toLowerCase()).toContain('iphone');
    }
    console.log(`🔍 Tìm thấy ${products.length} sản phẩm chứa từ khóa "iPhone".`);
  });

  // 2. Test lọc theo giá tối thiểu (minPrice)
  test('Nên lọc sản phẩm có giá từ $1000 trở lên (minPrice = 1000)', async () => {
    const response = await productApi.getProducts({ minPrice: 1000 });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const products = ProductArraySchema.parse(body);

    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      expect(product.price).toBeGreaterThanOrEqual(1000);
    }
    console.log(`💰 Tìm thấy ${products.length} sản phẩm có giá >= $1000.`);
  });

  // 3. Test lọc theo giá tối đa (maxPrice)
  test('Nên lọc sản phẩm có giá tối đa $500 (maxPrice = 500)', async () => {
    const response = await productApi.getProducts({ maxPrice: 500 });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const products = ProductArraySchema.parse(body);

    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      expect(product.price).toBeLessThanOrEqual(500);
    }
    console.log(`🏷️ Tìm thấy ${products.length} sản phẩm có giá <= $500.`);
  });

  // 4. Kết hợp nhiều bộ lọc (search & minPrice & maxPrice)
  test('Nên kết hợp lọc: tên chứa từ "Pro", giá từ $1000 đến $3500', async () => {
    const response = await productApi.getProducts({
      search: 'Pro',
      minPrice: 1000,
      maxPrice: 3500
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const products = ProductArraySchema.parse(body);

    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      expect(product.name.toLowerCase()).toContain('pro');
      expect(product.price).toBeGreaterThanOrEqual(1000);
      expect(product.price).toBeLessThanOrEqual(3500);
    }
    console.log(`⚙️ Kết hợp lọc: Tìm thấy ${products.length} sản phẩm phù hợp.`);
  });
});

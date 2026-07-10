import { z } from 'zod';

// Schema Product (Sản phẩm)
export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  stock: z.number(),
  description: z.string()
});

export const ProductArraySchema = z.array(ProductSchema);

// Schema Cart Item Detail (Chi tiết phần tử trong giỏ hàng có kèm thông tin sản phẩm)
export const CartItemDetailSchema = z.object({
  product: ProductSchema,
  quantity: z.number(),
  itemTotal: z.number()
});

// Schema Cart (Giỏ hàng)
export const CartSchema = z.object({
  items: z.array(CartItemDetailSchema),
  totalCartAmount: z.number()
});

// Schema Order Item (Phần tử trong đơn hàng)
export const OrderItemSchema = z.object({
  productId: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  itemTotal: z.number()
});

// Schema Order (Đơn đặt hàng)
export const OrderSchema = z.object({
  id: z.number(),
  items: z.array(OrderItemSchema),
  totalAmount: z.number(),
  status: z.string(),
  createdAt: z.string()
});

export const OrderArraySchema = z.array(OrderSchema);

// Kiểu dữ liệu suy luận từ Schema
export type Product = z.infer<typeof ProductSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type Order = z.infer<typeof OrderSchema>;

import { z } from 'zod';

import { apiRequest } from './client';
import { productSchema } from './products';

const cartItemSchema = z.object({ id: z.string(), quantity: z.number().int().positive(), product: productSchema, lineTotal: z.number() });
export const cartSchema = z.object({ id: z.string().nullable(), items: z.array(cartItemSchema), subtotal: z.number(), itemCount: z.number().int().nonnegative() });
export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;

export const getCart = () => apiRequest('/api/cart', { auth: true, schema: cartSchema });
export const addCartItem = (productId: number, quantity: number) => apiRequest('/api/cart/items', { method: 'POST', auth: true, body: { productId, quantity }, schema: cartItemSchema.omit({ lineTotal: true }) });
export const updateCartItem = (cartItemId: string, quantity: number) => apiRequest(`/api/cart/items/${cartItemId}`, { method: 'PATCH', auth: true, body: { quantity }, schema: cartItemSchema.omit({ lineTotal: true }) });
export const removeCartItem = (cartItemId: string) => apiRequest<void>(`/api/cart/items/${cartItemId}`, { method: 'DELETE', auth: true });

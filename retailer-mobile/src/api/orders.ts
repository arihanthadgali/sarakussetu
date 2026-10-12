import { z } from 'zod';

import { apiRequest } from './client';

export const orderStatusSchema = z.string().min(1);
export const orderItemSchema = z.object({ id: z.string(), productId: z.number(), productName: z.string(), quantity: z.number().int().positive(), unitPrice: z.number(), lineTotal: z.number() });
export const orderSchema = z.object({ id: z.string(), status: orderStatusSchema, subtotal: z.number(), createdAt: z.string(), items: z.array(orderItemSchema) });
export type RetailerOrder = z.infer<typeof orderSchema>;

export const getOrders = () => apiRequest('/api/orders', { auth: true, schema: z.array(orderSchema) });
export const getOrder = (orderId: string) => apiRequest(`/api/orders/${orderId}`, { auth: true, schema: orderSchema });
export const createOrder = () => apiRequest('/api/orders', { method: 'POST', auth: true, schema: orderSchema.omit({ createdAt: true }) });
export const cancelOrder = (orderId: string) => apiRequest(`/api/orders/${orderId}`, { method: 'DELETE', auth: true, schema: z.object({ id: z.string(), status: orderStatusSchema }) });

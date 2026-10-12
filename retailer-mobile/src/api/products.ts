import { z } from 'zod';

import { apiRequest } from './client';
import { env } from '@/config/env';

export const productSchema = z.object({ id: z.number().int().positive(), name: z.string(), description: z.string().nullable(), price: z.number(), imageUrl: z.string().nullable() });
export type Product = z.infer<typeof productSchema>;

export const getProducts = () => apiRequest('/api/products', { schema: z.array(productSchema) });

/** Backend product images are currently stored as relative /uploads paths. */
export function resolveProductImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (!imageUrl.startsWith('/')) return null;
  return `${env.apiBaseUrl}${imageUrl}`;
}

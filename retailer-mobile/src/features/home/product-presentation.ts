import type { Product } from '@/api/products';

import type { CategoryKey, HomeProduct } from './types';

const categoryMatchers: Record<CategoryKey, readonly RegExp[]> = {
  grocery: [/rice|dal|pulse|sugar|salt|flour|atta|oil|ghee|masala|spice|grain/i],
  vegetables: [/tomato|onion|potato|carrot|vegetable|beans|cabbage|chilli/i],
  stationery: [/paper|pen|pencil|notebook|stationery|eraser|marker/i],
  beverages: [/tea|coffee|juice|soda|drink|beverage|water/i],
};

/** Temporary client-side categorisation until products expose an authoritative category. */
export function categoryForProduct(product: Pick<Product, 'name' | 'description'>): CategoryKey {
  const text = `${product.name} ${product.description ?? ''}`;
  return (Object.keys(categoryMatchers) as CategoryKey[]).find((category) => categoryMatchers[category].some((matcher) => matcher.test(text))) ?? 'grocery';
}

export function toHomeProduct(product: Product): HomeProduct {
  return { id: String(product.id), name: product.name, price: product.price, imageUrl: product.imageUrl, category: categoryForProduct(product), packLabel: product.description ?? 'Available to order', unit: 'unit', minQty: 1, step: 1, stock: 'in_stock', icon: 'package-variant-closed' };
}

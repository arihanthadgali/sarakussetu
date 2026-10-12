import { resolveProductImageUrl } from '@/api/products';

import { categoryForProduct } from './product-presentation';

describe('product presentation', () => {
  it('resolves relative backend upload URLs and preserves absolute URLs', () => {
    expect(resolveProductImageUrl('/uploads/products/rice.webp')).toContain('/uploads/products/rice.webp');
    expect(resolveProductImageUrl('https://cdn.example.test/rice.webp')).toBe('https://cdn.example.test/rice.webp');
    expect(resolveProductImageUrl(null)).toBeNull();
  });
  it('uses the isolated temporary category mapping', () => {
    expect(categoryForProduct({ name: 'Tomato', description: null })).toBe('vegetables');
    expect(categoryForProduct({ name: 'Blue Ball Pens', description: null })).toBe('stationery');
    expect(categoryForProduct({ name: 'Tea Powder', description: null })).toBe('beverages');
  });
});

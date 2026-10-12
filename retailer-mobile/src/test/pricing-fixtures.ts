// Synthetic products and quantities for pricing unit tests only.
import type { HomeProduct } from '@/features/home/types';

export const pricingProducts: HomeProduct[] = [
  // Grocery
  { id: 'rice-sona', name: 'Sona Masuri Rice', price: 1450, category: 'grocery', packLabel: '25 kg bag', unit: 'bag', minQty: 1, step: 1, bulk: { minQty: 5, price: 1420 }, stock: 'in_stock', icon: 'sack' },
  { id: 'sugar', name: 'Sugar', price: 42, category: 'grocery', packLabel: 'Loose · min 10 kg', unit: 'kg', minQty: 10, step: 5, bulk: { minQty: 50, price: 41 }, stock: 'in_stock', icon: 'sack' },
  { id: 'toor-dal', name: 'Toor Dal', price: 3300, category: 'grocery', packLabel: '25 kg bag', unit: 'bag', minQty: 1, step: 1, bulk: { minQty: 4, price: 3240 }, stock: 'low_stock', icon: 'sack' },
  { id: 'sunflower-oil', name: 'Sunflower Oil', price: 125, category: 'grocery', packLabel: '1 L pouch · min 10', unit: 'pouch', minQty: 10, step: 10, bulk: { minQty: 50, price: 121 }, stock: 'in_stock', icon: 'shaker-outline' },

  // Vegetables
  { id: 'tomato', name: 'Tomato', price: 32, category: 'vegetables', packLabel: 'Loose · min 5 kg', unit: 'kg', minQty: 5, step: 1, stock: 'in_stock', icon: 'food-apple-outline' },
  { id: 'onion', name: 'Onion', price: 28, category: 'vegetables', packLabel: 'Loose · min 5 kg', unit: 'kg', minQty: 5, step: 1, bulk: { minQty: 50, price: 26 }, stock: 'in_stock', icon: 'food-apple-outline' },
  { id: 'potato', name: 'Potato', price: 24, category: 'vegetables', packLabel: 'Loose · min 10 kg', unit: 'kg', minQty: 10, step: 5, bulk: { minQty: 50, price: 22 }, stock: 'in_stock', icon: 'food-apple-outline' },
  { id: 'carrot', name: 'Carrot', price: 46, category: 'vegetables', packLabel: 'Loose · min 2 kg', unit: 'kg', minQty: 2, step: 1, stock: 'out_of_stock', icon: 'carrot' },

  // Stationery
  { id: 'a4-ream', name: 'A4 Paper Ream', price: 285, category: 'stationery', packLabel: '500 sheets · 75 gsm', unit: 'ream', minQty: 1, step: 1, bulk: { minQty: 10, price: 270 }, stock: 'in_stock', icon: 'pencil-outline' },
  { id: 'ball-pens', name: 'Blue Ball Pens', price: 90, category: 'stationery', packLabel: 'Box of 20', unit: 'box', minQty: 1, step: 1, bulk: { minQty: 10, price: 84 }, stock: 'in_stock', icon: 'pencil-outline' },

  // Beverages
  { id: 'tea-powder', name: 'Tea Powder', price: 420, category: 'beverages', packLabel: '1 kg pack', unit: 'pack', minQty: 1, step: 1, bulk: { minQty: 10, price: 405 }, stock: 'in_stock', icon: 'cup-outline' },
  { id: 'soda-crate', name: 'Soda 200 ml', price: 360, category: 'beverages', packLabel: 'Crate of 24', unit: 'crate', minQty: 1, step: 1, stock: 'low_stock', icon: 'bottle-soda-outline' },
];
/** Matches the design: 5 products, ₹8,082. */
export const pricingCart: Record<string, number> = {
  tomato: 11,
  onion: 10,
  'rice-sona': 2,
  'toor-dal': 1,
  'sunflower-oil': 10,
};

export function findPricingProduct(id: string): HomeProduct | undefined {
  return pricingProducts.find((product) => product.id === id);
}

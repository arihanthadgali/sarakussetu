import type { Category } from './types';

// UI filters; the backend does not expose category metadata.
export const categories: Category[] = [
  { key: 'grocery', label: 'Grocery' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'stationery', label: 'Stationery' },
  { key: 'beverages', label: 'Beverages' },
];

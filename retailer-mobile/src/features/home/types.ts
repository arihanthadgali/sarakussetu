/**
 * UI view models for the Home shell.
 *
 * These are NOT backend response types. Today GET /api/products returns only
 * { id, name, description, price, imageUrl }. Every field below marked
 * BACKEND REQUIRED has no backend source yet; presentation uses UI defaults or heuristics.
 */
import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type CategoryKey = 'grocery' | 'vegetables' | 'stationery' | 'beverages';

export type Category = {
  key: CategoryKey;
  label: string;
};

export type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock';

export type ProductIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type HomeProduct = {
  id: string;
  name: string; // backend: products.name
  price: number; // backend: products.price (rupees)
  imageUrl?: string | null; // backend: products.imageUrl
  category: CategoryKey; // BACKEND REQUIRED (no category model)
  packLabel: string; // BACKEND REQUIRED e.g. "25 kg bag", "Loose · min 10 kg"
  unit: string; // BACKEND REQUIRED e.g. "bag", "kg"
  minQty: number; // BACKEND REQUIRED (MOQ)
  step: number; // BACKEND REQUIRED (order increment)
  bulk?: { minQty: number; price: number }; // BACKEND REQUIRED (slab pricing)
  stock: StockLevel; // BACKEND REQUIRED (not exposed to retailers)
  icon: ProductIcon; // placeholder until imageUrl is real
};

export type ActiveOrderSummary = {
  displayId: string; // backend order id is numeric; "SS-" prefix is display only
  statusLabel: string; // BACKEND REQUIRED for delivery status (not in retailer order responses)
  itemCount: number;
  note: string; // BACKEND REQUIRED (route / ETA)
};

export type BuyAgainItem = {
  productId: string;
  lastQty: number; // derivable later from GET /api/orders items
};

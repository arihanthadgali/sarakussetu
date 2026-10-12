import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { Product } from '@/api/products';

const GUEST_CART_STORAGE_KEY = 'sarakusetu-retailer-guest-cart';

type GuestLine = { product: Product; quantity: number };
type GuestCartState = {
  lines: Record<number, GuestLine>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setQuantity: (product: Product, quantity: number) => void;
  clear: () => void;
};

const persist = (lines: Record<number, GuestLine>) =>
  SecureStore.setItemAsync(GUEST_CART_STORAGE_KEY, JSON.stringify(lines)).catch(() => undefined);

export const useGuestCart = create<GuestCartState>((set, get) => ({
  lines: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;

    try {
      const stored = await SecureStore.getItemAsync(GUEST_CART_STORAGE_KEY);
      if (stored) set({ lines: JSON.parse(stored) as Record<number, GuestLine> });
    } catch {
      // A guest cart is convenience data and must not prevent browsing.
    } finally {
      set({ hydrated: true });
    }
  },
  setQuantity: (product, quantity) => set((state) => {
    const lines = { ...state.lines };
    if (quantity <= 0) delete lines[product.id];
    else lines[product.id] = { product, quantity };
    void persist(lines);
    return { lines };
  }),
  clear: () => {
    set({ lines: {} });
    void SecureStore.deleteItemAsync(GUEST_CART_STORAGE_KEY).catch(() => undefined);
  },
}));

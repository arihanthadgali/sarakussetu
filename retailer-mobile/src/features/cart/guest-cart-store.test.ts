import * as SecureStore from 'expo-secure-store';

import type { Product } from '@/api/products';

import { useGuestCart } from './guest-cart-store';

const rice: Product = {
  id: 1,
  name: 'Rice',
  description: '5 kg bag',
  price: 250,
  imageUrl: null,
};

describe('guest cart', () => {
  beforeEach(() => useGuestCart.getState().clear());

  it('adds, changes, and removes a product locally before sign-in', () => {
    useGuestCart.getState().setQuantity(rice, 2);
    expect(useGuestCart.getState().lines[1]).toEqual({ product: rice, quantity: 2 });

    useGuestCart.getState().setQuantity(rice, 3);
    expect(useGuestCart.getState().lines[1]?.quantity).toBe(3);

    useGuestCart.getState().setQuantity(rice, 0);
    expect(useGuestCart.getState().lines).toEqual({});
  });

  it('restores the persisted guest cart before the app is shown', async () => {
    await SecureStore.setItemAsync('sarakusetu-retailer-guest-cart', JSON.stringify({ 1: { product: rice, quantity: 2 } }));
    useGuestCart.setState({ lines: {}, hydrated: false });

    await useGuestCart.getState().hydrate();

    expect(useGuestCart.getState().lines[1]?.quantity).toBe(2);
    expect(useGuestCart.getState().hydrated).toBe(true);
  });
});

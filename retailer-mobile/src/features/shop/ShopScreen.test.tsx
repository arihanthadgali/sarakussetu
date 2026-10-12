import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSession } from '@/features/auth/session-store';
import { useGuestCart } from '@/features/cart/guest-cart-store';
import { mockFetch } from '@/test/fetch';

import { ShopScreen } from './ShopScreen';

const products = [
  { id: 1, name: 'Rice', description: 'Premium grocery rice', price: 250, imageUrl: '/uploads/products/rice.webp' },
  { id: 2, name: 'Tomato', description: 'Fresh vegetables', price: 30, imageUrl: null },
  { id: 3, name: 'Blue Pen', description: 'Stationery pen', price: 10, imageUrl: null },
  { id: 4, name: 'Tea', description: 'Hot beverage', price: 50, imageUrl: null },
];
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const wrapper = ({ children }: { children: ReactNode }) => <SafeAreaProvider initialMetrics={metrics}><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider></SafeAreaProvider>;

describe('ShopScreen', () => {
  beforeEach(async () => {
    await act(async () => {
      useSession.setState({ status: 'signedOut', token: null, customer: null });
      useGuestCart.setState({ lines: {}, hydrated: true });
    });
  });

  it('loads real products and renders their image treatment', async () => {
    mockFetch({ status: 200, body: products });
    await render(<ShopScreen onViewCart={jest.fn()} />, { wrapper });

    expect(await screen.findByText('Rice')).toBeTruthy();
    expect(screen.getByLabelText('Rice product image')).toBeTruthy();
  });

  it('searches product names and descriptions and can clear an empty search', async () => {
    mockFetch({ status: 200, body: products });
    await render(<ShopScreen onViewCart={jest.fn()} />, { wrapper });
    await screen.findByText('Rice');

    fireEvent.changeText(screen.getByLabelText('Search products'), 'beverage');
    expect(await screen.findByText('Tea')).toBeTruthy();
    expect(screen.queryByText('Rice')).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Search products'), 'not-a-product');
    expect(await screen.findByText('No products found')).toBeTruthy();
    await fireEvent.press(screen.getByText('Clear search'));
    expect(screen.getByText('Rice')).toBeTruthy();
  });

  it.each([
    ['Grocery', 'Rice'],
    ['Vegetables', 'Tomato'],
    ['Stationery', 'Blue Pen'],
    ['Beverages', 'Tea'],
  ])('filters %s products', async (category, expectedProduct) => {
    mockFetch({ status: 200, body: products });
    await render(<ShopScreen onViewCart={jest.fn()} />, { wrapper });
    await screen.findByText('Rice');

    await fireEvent.press(screen.getByRole('tab', { name: category }));
    expect(screen.getByText(expectedProduct)).toBeTruthy();
  });

  it('adds a product to the shared guest cart and displays its quantity', async () => {
    mockFetch({ status: 200, body: products });
    const onViewCart = jest.fn();
    await render(<ShopScreen onViewCart={onViewCart} />, { wrapper });
    await fireEvent.press(await screen.findByLabelText('Add 1 unit of Rice for ₹250'));

    expect(useGuestCart.getState().lines[1]?.quantity).toBe(1);
    expect(screen.getByLabelText('In cart, ₹250')).toBeTruthy();
    expect(screen.getByLabelText('View cart, 1 product · ₹250')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Increase Rice'));
    expect(useGuestCart.getState().lines[1]?.quantity).toBe(2);
  });

  it('shows an error and retries the product query', async () => {
    mockFetch({ status: 500, body: { message: 'Unavailable' } }, { status: 200, body: products });
    await render(<ShopScreen onViewCart={jest.fn()} />, { wrapper });
    await screen.findByText('Unable to load the catalogue.');

    await fireEvent.press(screen.getByText('Retry'));
    expect(await screen.findByText('Rice')).toBeTruthy();
  });
});

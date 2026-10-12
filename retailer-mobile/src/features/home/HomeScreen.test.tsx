import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { mockFetch } from '@/test/fetch';
import { useSession } from '@/features/auth/session-store';
import { useGuestCart } from '@/features/cart/guest-cart-store';

import { HomeScreen } from './HomeScreen';

const products = [{ id: 1, name: 'Rice', description: '5 kg bag', price: 250, imageUrl: '/uploads/products/rice.webp' }, { id: 2, name: 'Tomato', description: null, price: 30, imageUrl: null }];
const emptyCart = { id: null, items: [], subtotal: 0, itemCount: 0 };
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const wrapper = ({ children }: { children: ReactNode }) => <SafeAreaProvider initialMetrics={metrics}><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider></SafeAreaProvider>;

describe('HomeScreen server data', () => {
  beforeEach(async () => {
    await act(async () => {
      useSession.setState({ status: 'signedIn', token: 'test-token', customer: { id: '7', phoneNumber: '+919876543210' } });
      useGuestCart.getState().clear();
    });
  });

  afterEach(async () => {
    await act(async () => {
      useSession.setState({ status: 'signedOut', token: null, customer: null });
      useGuestCart.getState().clear();
    });
  });

  it('renders products returned by the backend and an empty server cart', async () => {
    mockFetch({ status: 200, body: emptyCart }, { status: 200, body: products }, { status: 200, body: [] });
    await render(<HomeScreen onViewCart={jest.fn()} onTrackOrder={jest.fn()} onOpenProfile={jest.fn()} onOpenShop={jest.fn()} />, { wrapper });
    expect(await screen.findByText('Rice')).toBeTruthy();
    expect(screen.getByLabelText('Add 1 unit of Rice for ₹250')).toBeTruthy();
  });
  it('adds products through the server cart API', async () => {
    const calls = mockFetch({ status: 200, body: emptyCart }, { status: 200, body: products }, { status: 200, body: [] }, { status: 201, body: { id: '5', quantity: 1, product: products[0] } }, { status: 200, body: { id: '4', items: [{ id: '5', quantity: 1, product: products[0], lineTotal: 250 }], subtotal: 250, itemCount: 1 } });
    await render(<HomeScreen onViewCart={jest.fn()} onTrackOrder={jest.fn()} onOpenProfile={jest.fn()} onOpenShop={jest.fn()} />, { wrapper });
    await fireEvent.press(await screen.findByLabelText('Add 1 unit of Rice for ₹250'));
    expect(calls.some((call) => call.url.endsWith('/api/cart/items') && call.init?.method === 'POST')).toBe(true);
  });
  it('filters the loaded products when a category is selected', async () => {
    mockFetch({ status: 200, body: emptyCart }, { status: 200, body: products }, { status: 200, body: [] });
    await render(<HomeScreen onViewCart={jest.fn()} onTrackOrder={jest.fn()} onOpenProfile={jest.fn()} onOpenShop={jest.fn()} />, { wrapper });
    expect(await screen.findByText('Rice')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: 'Vegetables' }));
    expect(screen.getByText('Tomato')).toBeTruthy();
    expect(screen.queryByText('Rice')).toBeNull();
  });
  it('shows the real session phone number without demo identity or unread notifications', async () => {
    mockFetch({ status: 200, body: emptyCart }, { status: 200, body: products }, { status: 200, body: [] });
    const onOpenProfile = jest.fn();
    await render(<HomeScreen onViewCart={jest.fn()} onTrackOrder={jest.fn()} onOpenProfile={onOpenProfile} onOpenShop={jest.fn()} />, { wrapper });
    expect(await screen.findByText('Rice')).toBeTruthy();
    expect(screen.getByText('+919876543210')).toBeTruthy();
    expect(screen.queryByText(/Ganesh Traders|Laxmeshwar/)).toBeNull();
    expect(screen.queryByLabelText(/unread/i)).toBeNull();
    expect(screen.queryByText('2')).toBeNull();
    expect(screen.getByLabelText('Notifications unavailable')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Profile'));
    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });

  it('uses a neutral label when signed-in identity is unavailable', async () => {
    await act(async () => { useSession.setState({ customer: null }); });
    mockFetch({ status: 200, body: emptyCart }, { status: 200, body: products }, { status: 200, body: [] });
    await render(<HomeScreen onViewCart={jest.fn()} onTrackOrder={jest.fn()} onOpenProfile={jest.fn()} onOpenShop={jest.fn()} />, { wrapper });
    expect(await screen.findByText('Rice')).toBeTruthy();
    expect(screen.getByText('Retailer account')).toBeTruthy();
  });

  it('renders and tracks the active order returned by the backend', async () => {
    const order = { id: '42', status: 'PENDING', subtotal: 750, createdAt: '2026-01-01T00:00:00Z', items: [{ id: '1', productId: 1, productName: 'Rice', quantity: 3, unitPrice: 250, lineTotal: 750 }] };
    mockFetch({ status: 200, body: emptyCart }, { status: 200, body: products }, { status: 200, body: [order] });
    const onTrackOrder = jest.fn();
    await render(<HomeScreen onViewCart={jest.fn()} onTrackOrder={onTrackOrder} onOpenProfile={jest.fn()} onOpenShop={jest.fn()} />, { wrapper });
    const card = await screen.findByLabelText('Order 42, Order received, 3 items. Track order');
    await fireEvent.press(card);
    expect(onTrackOrder).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/SS-10241/)).toBeNull();
  });

  it('supports signed-out product browsing and adding to the guest cart', async () => {
    await act(async () => { useSession.setState({ status: 'signedOut', token: null, customer: null }); });
    const calls = mockFetch({ status: 200, body: products }, { status: 401, body: { message: 'Unauthorized' } });
    await render(<HomeScreen onViewCart={jest.fn()} onTrackOrder={jest.fn()} onOpenProfile={jest.fn()} onOpenShop={jest.fn()} />, { wrapper });
    expect(await screen.findByText('Rice')).toBeTruthy();
    expect(screen.getByText('Browse products')).toBeTruthy();
    expect(screen.queryByText(/Ganesh Traders|Laxmeshwar/)).toBeNull();
    expect(screen.queryByLabelText(/unread/i)).toBeNull();
    await fireEvent.press(screen.getByLabelText('Add 1 unit of Rice for ₹250'));
    expect(useGuestCart.getState().lines['1']?.quantity).toBe(1);
    expect(calls.some((call) => call.url.includes('/api/cart'))).toBe(false);
  });

});

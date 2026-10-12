import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import type { RetailerOrder } from '@/api/orders';

import { OrderDetailsScreen } from './OrderDetailsScreen';
import { OrderStatusTimeline } from './OrderStatusTimeline';

const order: RetailerOrder = {
  id: '42',
  status: 'PROCESSING',
  subtotal: 530,
  createdAt: '2026-10-01T09:30:00.000Z',
  items: [
    { id: '1', productId: 1, productName: 'Rice', quantity: 2, unitPrice: 250, lineTotal: 500 },
    { id: '2', productId: 2, productName: 'Tea', quantity: 1, unitPrice: 30, lineTotal: 30 },
  ],
};

describe('OrderStatusTimeline', () => {
  afterEach(() => cleanup());
  it.each([
    ['PENDING', 'Order Placed'],
    ['PROCESSING', 'Processing'],
    ['READY', 'Ready'],
    ['COMPLETED', 'Completed'],
  ])('marks %s as the current normal status', async (status, label) => {
    await render(<OrderStatusTimeline status={status} />);
    expect(screen.getByLabelText(`Order timeline: ${label}`)).toBeTruthy();
    expect(screen.getByText('Current status')).toBeTruthy();
  });

  it('separates cancellation from the normal fulfilment timeline', async () => {
    await render(<OrderStatusTimeline status="CANCELLED" />);
    expect(screen.getByText('Order cancelled')).toBeTruthy();
    expect(screen.queryByText('Upcoming')).toBeNull();
  });

  it('shows an unknown backend status safely', async () => {
    await render(<OrderStatusTimeline status="ON_HOLD" />);
    expect(screen.getByText('Order status update')).toBeTruthy();
    expect(screen.getByText('Current status: ON HOLD')).toBeTruthy();
  });
});

describe('OrderDetailsScreen', () => {
  const props = { onRetry: jest.fn(), onRefresh: jest.fn(), onBack: jest.fn() };

  beforeEach(() => jest.clearAllMocks());
  afterEach(() => cleanup());

  it('shows header, order items, and only the authoritative subtotal', async () => {
    await render(<OrderDetailsScreen order={order} isLoading={false} error={null} isRefreshing={false} {...props} />);
    expect(screen.getByText('Order #42')).toBeTruthy();
    expect(screen.getByText('Rice')).toBeTruthy();
    expect(screen.getByText('2 × ₹250')).toBeTruthy();
    expect(screen.getByText('₹500')).toBeTruthy();
    expect(screen.getByText('Tea')).toBeTruthy();
    expect(screen.getByText('Subtotal')).toBeTruthy();
    expect(screen.getByText('₹530')).toBeTruthy();
    expect(screen.queryByText('Payment')).toBeNull();
  });

  it('shows loading, error retry, and not-found states', async () => {
    const loading = await render(<OrderDetailsScreen isLoading error={null} isRefreshing={false} {...props} />);
    expect(screen.getByText('Loading order…')).toBeTruthy();
    await loading.unmount();

    const failed = await render(<OrderDetailsScreen isLoading={false} error={new Error('offline')} isRefreshing={false} {...props} />);
    await fireEvent.press(screen.getByText('Retry'));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
    await failed.unmount();

    await render(<OrderDetailsScreen isLoading={false} error={null} isRefreshing={false} {...props} />);
    expect(screen.getByText('Order not found.')).toBeTruthy();
  });

  it('offers a manual refresh action', async () => {
    await render(<OrderDetailsScreen order={order} isLoading={false} error={null} isRefreshing={false} {...props} />);
    await fireEvent.press(screen.getByLabelText('Refresh order'));
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });
});

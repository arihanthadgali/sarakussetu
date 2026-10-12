import { createOrder, getOrders } from './orders';
import { mockFetch } from '@/test/fetch';

describe('orders API', () => {
  it('gets the authenticated retailer order list using the backend response shape', async () => {
    const calls = mockFetch({ status: 200, body: [{ id: '1', status: 'PENDING', subtotal: 125, createdAt: '2026-10-01T00:00:00.000Z', items: [] }] });
    await expect(getOrders()).resolves.toHaveLength(1);
    expect(calls[0]?.url).toContain('/api/orders');
    expect(calls[0]?.init?.headers).toEqual(expect.objectContaining({ Accept: 'application/json' }));
  });

  it('creates an order from the authenticated server cart', async () => {
    const calls = mockFetch({
      status: 201,
      body: { id: '2', status: 'PENDING', subtotal: 125, items: [] },
    });

    await expect(createOrder()).resolves.toMatchObject({ id: '2', status: 'PENDING' });
    expect(calls[0]?.url).toContain('/api/orders');
    expect(calls[0]?.init?.method).toBe('POST');
  });
});

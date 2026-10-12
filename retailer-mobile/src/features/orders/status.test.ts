import { orderStatusPresentation } from './status';

describe('order status presentation', () => {
  it('covers every backend order status without inventing new values', () => {
    expect(orderStatusPresentation.PENDING.label).toBe('Order received');
    expect(orderStatusPresentation.READY.label).toBe('Ready');
    expect(orderStatusPresentation.CANCELLED.label).toBe('Cancelled');
  });
});

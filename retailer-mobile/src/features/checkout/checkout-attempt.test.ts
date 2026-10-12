import { ApiError } from '@/api/errors';
import { CheckoutUncertainError, createCheckoutAttempt } from './checkout-attempt';

const lines = [{ product: { id: 1 }, quantity: 2 }, { product: { id: 2 }, quantity: 3 }];
const orderResult = { id: '8', status: 'PENDING', subtotal: 100, items: [] };
const rejected = () => new ApiError({ kind: 'http', status: 400, message: 'Rejected' });
function setup() {
  const addItem = jest.fn().mockResolvedValue({});
  const order = jest.fn().mockResolvedValue(orderResult);
  const clearGuest = jest.fn();
  const attempt = createCheckoutAttempt(lines, { addItem, order, clearGuest });
  return { addItem, order, clearGuest, attempt };
}

test('merges each quantity once, creates order, then clears guest cart', async () => {
  const { attempt, addItem, order, clearGuest } = setup();
  order.mockImplementation(async () => {
    expect(clearGuest).not.toHaveBeenCalled();
    return orderResult;
  });
  expect(await attempt.run()).toEqual(orderResult);
  expect(addItem.mock.calls).toEqual([[1, 2], [2, 3]]);
  expect(clearGuest).toHaveBeenCalledTimes(1);
  await attempt.run();
  expect(order).toHaveBeenCalledTimes(1);
  expect(addItem).toHaveBeenCalledTimes(2);
});

test('partial merge retry resumes at rejected item without re-adding successful item', async () => {
  const { attempt, addItem, clearGuest } = setup();
  addItem.mockResolvedValueOnce({}).mockRejectedValueOnce(rejected());
  await expect(attempt.run()).rejects.toThrow('Rejected');
  expect(clearGuest).not.toHaveBeenCalled();
  await attempt.run();
  expect(addItem.mock.calls).toEqual([[1, 2], [2, 3], [2, 3]]);
});

test('first-item rejection can be retried without losing guest data', async () => {
  const { attempt, addItem, order, clearGuest } = setup();
  addItem.mockRejectedValueOnce(rejected());
  await expect(attempt.run()).rejects.toThrow();
  expect(order).not.toHaveBeenCalled();
  expect(clearGuest).not.toHaveBeenCalled();
  await attempt.run();
  expect(addItem.mock.calls).toEqual([[1, 2], [1, 2], [2, 3]]);
});

test('order rejection retains guest data and retries order only', async () => {
  const { attempt, addItem, order, clearGuest } = setup();
  order.mockRejectedValueOnce(rejected());
  await expect(attempt.run()).rejects.toThrow();
  expect(clearGuest).not.toHaveBeenCalled();
  await attempt.run();
  expect(addItem).toHaveBeenCalledTimes(2);
  expect(order).toHaveBeenCalledTimes(2);
  expect(clearGuest).toHaveBeenCalledTimes(1);
});

test.each(['timeout', 'network', 'invalid_response', 'http'] as const)('ambiguous %s merge failure is never replayed', async (kind) => {
  const { attempt, addItem, order, clearGuest } = setup();
  // The server may have applied this write before returning an error.
  addItem.mockRejectedValueOnce(new ApiError({ kind, status: 500, message: 'Uncertain' }));
  await expect(attempt.run()).rejects.toBeInstanceOf(CheckoutUncertainError);
  await expect(attempt.run()).rejects.toBeInstanceOf(CheckoutUncertainError);
  expect(addItem).toHaveBeenCalledTimes(1);
  expect(order).not.toHaveBeenCalled();
  expect(clearGuest).not.toHaveBeenCalled();
});

test('lost order response blocks a second order and preserves guest data', async () => {
  const { attempt, order, clearGuest } = setup();
  order.mockRejectedValueOnce(new ApiError({ kind: 'timeout', message: 'Uncertain' }));
  await expect(attempt.run()).rejects.toBeInstanceOf(CheckoutUncertainError);
  await expect(attempt.run()).rejects.toBeInstanceOf(CheckoutUncertainError);
  expect(order).toHaveBeenCalledTimes(1);
  expect(clearGuest).not.toHaveBeenCalled();
});

test('overlapping submissions share the same sequence', async () => {
  const { attempt, order, addItem } = setup();
  const first = attempt.run();
  expect(attempt.run()).toBe(first);
  await first;
  expect(order).toHaveBeenCalledTimes(1);
  expect(addItem).toHaveBeenCalledTimes(2);
});

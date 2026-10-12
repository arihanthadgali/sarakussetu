import { addCartItem } from '@/api/cart';
import { isApiError } from '@/api/errors';
import { createOrder } from '@/api/orders';

export class CheckoutUncertainError extends Error {
  constructor() {
    super('We could not confirm the last request. Check your orders and cart before starting another checkout. Do not retry while the result is uncertain.');
  }
}

// Only explicit rejection responses are safe to retry. Timeouts, lost responses,
// invalid success bodies and server errors can all follow a committed write.
function rejectedWithoutWrite(error: unknown): boolean {
  return isApiError(error) && error.kind === 'http' &&
    [400, 401, 403, 404, 409, 422, 429].includes(error.status ?? 0);
}

type Dependencies = {
  addItem: typeof addCartItem;
  order: typeof createOrder;
  clearGuest: () => void;
};

/** One checkout attempt: snapshot quantities, retain confirmed progress, coalesce submissions. */
export function createCheckoutAttempt(
  lines: { product: { id: number }; quantity: number }[],
  dependencies: Dependencies,
) {
  const snapshot = lines.map((line) => ({ productId: line.product.id, quantity: line.quantity }));
  let nextItem = 0;
  let uncertain = false;
  let completed: Awaited<ReturnType<typeof createOrder>> | undefined;
  let pending: Promise<Awaited<ReturnType<typeof createOrder>>> | undefined;

  async function execute() {
    if (completed) return completed;
    if (uncertain) throw new CheckoutUncertainError();
    try {
      while (nextItem < snapshot.length) {
        const line = snapshot[nextItem]!;
        await dependencies.addItem(line.productId, line.quantity);
        nextItem += 1;
      }
      completed = await dependencies.order();
    } catch (error) {
      if (!rejectedWithoutWrite(error)) {
        uncertain = true;
        throw new CheckoutUncertainError();
      }
      throw error;
    }
    dependencies.clearGuest();
    return completed;
  }

  return {
    run() {
      if (!pending) pending = execute().finally(() => { pending = undefined; });
      return pending;
    },
  };
}

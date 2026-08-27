import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { requireAuthentication } from '../middleware/authentication.js';
import { createCartRouter } from './cart.js';

const product = {
  id: 12n,
  name: 'Milk Chocolate Box',
  description: 'Premium milk chocolate gift box.',
  price: new Decimal('499.00'),
  imageUrl: 'https://example.com/products/milk-chocolate-box.jpg',
};

const createResponse = (customerId?: bigint) => {
  const response = {
    locals: customerId === undefined ? {} : { customerId },
    json: vi.fn(),
    status: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};

const createDatabase = (activeProduct: typeof product | null = product) => {
  const transaction = {
    cart: {
      upsert: vi.fn().mockResolvedValue({ id: 9n }),
    },
    cartItem: {
      create: vi.fn().mockResolvedValue({ id: 17n, quantity: 2 }),
      findUnique: vi.fn().mockResolvedValue(null),
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 17n, quantity: 2 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    product: {
      findFirst: vi.fn().mockResolvedValue(activeProduct),
    },
  };
  const database = {
    $transaction: vi.fn(async (callback: (client: typeof transaction) => unknown) => callback(transaction)),
  };

  return { database, transaction };
};

const getAddItemHandler = (database: ReturnType<typeof createDatabase>['database']) => {
  const router = createCartRouter({ database } as never);
  const route = router.stack.find((layer) => layer.route?.path === '/items');

  if (route?.route === undefined) {
    throw new Error('POST /items route not found.');
  }

  const [authenticationHandler, addItemHandler] = route.route.stack;
  if (authenticationHandler?.handle !== requireAuthentication || addItemHandler?.handle === undefined) {
    throw new Error('POST /items route does not require authentication.');
  }

  return addItemHandler.handle;
};

describe('POST /api/cart/items handler', () => {
  it('rejects requests without authenticated customer context', async () => {
    const { database } = createDatabase();
    const response = createResponse();

    await getAddItemHandler(database)(
      { body: { productId: '12', quantity: 2 } } as Request,
      response,
      vi.fn(),
    );

    expect(database.$transaction).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it.each([
    [{ quantity: 2 }],
    [{ productId: 'invalid', quantity: 2 }],
    [{ productId: '12', quantity: 0 }],
    [{ productId: '12', quantity: -1 }],
    [{ productId: '12', quantity: 1.5 }],
    [{ productId: '12', quantity: '2' }],
    [{ productId: '12', quantity: Number.NaN }],
    [{ productId: '12', quantity: 2_147_483_648 }],
  ])('rejects invalid request body %o', async (body) => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    await getAddItemHandler(database)({ body } as Request, response, vi.fn());

    expect(database.$transaction).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: 'A valid product ID and positive integer quantity are required.',
    });
  });

  it.each(['non-existent', 'inactive'])('rejects a %s product', async () => {
    const { database, transaction } = createDatabase(null);
    const response = createResponse(3n);

    await getAddItemHandler(database)(
      { body: { productId: '12', quantity: 2 } } as Request,
      response,
      vi.fn(),
    );

    expect(transaction.product.findFirst).toHaveBeenCalledWith({
      where: { id: 12n, active: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
      },
    });
    expect(transaction.cart.upsert).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: 'Product not found.' });
  });

  it('creates a cart and item for a customer without a cart', async () => {
    const { database, transaction } = createDatabase();
    const response = createResponse(3n);

    await getAddItemHandler(database)(
      { body: { productId: '12', quantity: 2 } } as Request,
      response,
      vi.fn(),
    );

    expect(transaction.cart.upsert).toHaveBeenCalledWith({
      where: { customerId: 3n },
      create: expect.objectContaining({ customerId: 3n }),
      update: expect.objectContaining({ updatedAt: expect.any(Date) }),
      select: { id: true },
    });
    expect(transaction.cartItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ cartId: 9n, productId: 12n, quantity: 2 }),
      select: { id: true, quantity: true },
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({
      id: '17',
      quantity: 2,
      product: {
        id: 12,
        name: 'Milk Chocolate Box',
        description: 'Premium milk chocolate gift box.',
        price: 499,
        imageUrl: 'https://example.com/products/milk-chocolate-box.jpg',
      },
    });
  });

  it('uses the existing cart and atomically increments an existing cart item', async () => {
    const { database, transaction } = createDatabase();
    transaction.cartItem.updateMany.mockResolvedValueOnce({ count: 1 });
    transaction.cartItem.findUniqueOrThrow.mockResolvedValueOnce({ id: 17n, quantity: 5 });
    const response = createResponse(3n);

    await getAddItemHandler(database)(
      { body: { productId: 12, quantity: 3 } } as Request,
      response,
      vi.fn(),
    );

    expect(transaction.cart.upsert).toHaveBeenCalledTimes(1);
    expect(transaction.cartItem.updateMany).toHaveBeenCalledWith({
      where: { cartId: 9n, productId: 12n, quantity: { lte: 2_147_483_644 } },
      data: expect.objectContaining({ quantity: { increment: 3 } }),
    });
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: '17', quantity: 5 }),
    );
  });

  it('rejects an increment that would exceed the MySQL INT quantity maximum', async () => {
    const { database, transaction } = createDatabase();
    transaction.cartItem.findUnique.mockResolvedValueOnce({ id: 17n });
    const response = createResponse(3n);

    await getAddItemHandler(database)(
      { body: { productId: '12', quantity: 1 } } as Request,
      response,
      vi.fn(),
    );

    expect(transaction.cartItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ quantity: { lte: 2_147_483_646 } }) }),
    );
    expect(transaction.cartItem.create).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: 'A valid product ID and positive integer quantity are required.',
    });
  });

  it('retries once after a unique-constraint race and returns the retried result', async () => {
    const { database, transaction } = createDatabase();
    transaction.cartItem.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.0',
      }),
    );
    transaction.cartItem.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    transaction.cartItem.findUniqueOrThrow.mockResolvedValueOnce({ id: 17n, quantity: 4 });
    const response = createResponse(3n);

    await getAddItemHandler(database)(
      { body: { productId: '12', quantity: 2 } } as Request,
      response,
      vi.fn(),
    );

    expect(database.$transaction).toHaveBeenCalledTimes(2);
    expect(transaction.cartItem.create).toHaveBeenCalledTimes(1);
    expect(transaction.cartItem.updateMany).toHaveBeenCalledTimes(2);
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ id: '17', quantity: 4 }));
  });
});

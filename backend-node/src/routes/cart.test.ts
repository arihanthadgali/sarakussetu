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

const productSelection = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
};

const createResponse = (customerId?: bigint) => {
  const response = {
    locals: customerId === undefined ? {} : { customerId },
    json: vi.fn(),
    send: vi.fn(),
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
    cart: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    cartItem: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      findFirst: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };

  return { database, transaction };
};

const getCartHandler = (database: ReturnType<typeof createDatabase>['database']) => {
  const router = createCartRouter({ database } as never);
  const route = router.stack.find((layer) => layer.route?.path === '/');

  if (route?.route === undefined) {
    throw new Error('GET / route not found.');
  }

  const [authenticationHandler, getCartRouteHandler] = route.route.stack;
  if (authenticationHandler?.handle !== requireAuthentication || getCartRouteHandler?.handle === undefined) {
    throw new Error('GET / route does not require authentication.');
  }

  return getCartRouteHandler.handle;
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

// const getUpdateItemHandler = (database: ReturnType<typeof createDatabase>['database']) => {
//   const router = createCartRouter({ database } as never);
//   const route = router.stack.find((layer) => layer.route?.path === '/items/:cartItemId');
//   if (route?.route === undefined) {
//     throw new Error('PATCH /items/:cartItemId route not found.');
//   }

//   const [authenticationHandler, updateItemHandler] = route.route.stack;
//   if (authenticationHandler?.handle !== requireAuthentication || updateItemHandler?.handle === undefined) {
//     throw new Error('PATCH /items/:cartItemId route does not require authentication.');
//   }

//   return updateItemHandler.handle;
// };

// const getRemoveItemHandler = (database: ReturnType<typeof createDatabase>['database']) => {
//   const router = createCartRouter({ database } as never);
//   const route = router.stack
//   .filter((layer) => layer.route?.path === '/items/:cartItemId')
//   .at(-1);

//   if (route?.route === undefined) {
//     throw new Error('DELETE /items/:cartItemId route not found.');
//   }

//   const [authenticationHandler, , removeItemHandler] = route.route.stack;
//   if (authenticationHandler?.handle !== requireAuthentication || removeItemHandler?.handle === undefined) {
//     throw new Error('DELETE /items/:cartItemId route does not require authentication.');
//   }

//   return removeItemHandler.handle;
// };
const getUpdateItemHandler = (database: ReturnType<typeof createDatabase>['database']) => {
  const router = createCartRouter({ database } as never);
  const routes = router.stack.filter(
    (layer) => layer.route?.path === '/items/:cartItemId',
  );
  const route = routes[0];

  if (route?.route === undefined) {
    throw new Error('PATCH /items/:cartItemId route not found.');
  }

  const [authenticationHandler, updateItemHandler] = route.route.stack;
  if (
    authenticationHandler?.handle !== requireAuthentication ||
    updateItemHandler?.handle === undefined
  ) {
    throw new Error('PATCH /items/:cartItemId route does not require authentication.');
  }

  return updateItemHandler.handle;
};

const getRemoveItemHandler = (database: ReturnType<typeof createDatabase>['database']) => {
  const router = createCartRouter({ database } as never);
  const routes = router.stack.filter(
    (layer) => layer.route?.path === '/items/:cartItemId',
  );
  const route = routes[1];

  if (route?.route === undefined) {
    throw new Error('DELETE /items/:cartItemId route not found.');
  }

  const [authenticationHandler, removeItemHandler] = route.route.stack;
  if (
    authenticationHandler?.handle !== requireAuthentication ||
    removeItemHandler?.handle === undefined
  ) {
    throw new Error('DELETE /items/:cartItemId route does not require authentication.');
  }

  return removeItemHandler.handle;
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

describe('GET /api/cart handler', () => {
  it('rejects requests without authenticated customer context', async () => {
    const { database } = createDatabase();
    const response = createResponse();

    await getCartHandler(database)({} as Request, response, vi.fn());

    expect(database.cart.findUnique).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('returns an empty cart without creating one when the customer has no cart', async () => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    await getCartHandler(database)({} as Request, response, vi.fn());

    expect(database.cart.findUnique).toHaveBeenCalledWith({
      where: { customerId: 3n },
      select: {
        id: true,
        items: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            quantity: true,
            product: { select: productSelection },
          },
        },
      },
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ id: null, items: [], subtotal: 0, itemCount: 0 });
  });

  it('returns an existing empty cart', async () => {
    const { database } = createDatabase();
    database.cart.findUnique.mockResolvedValueOnce({ id: 9n, items: [] });
    const response = createResponse(3n);

    await getCartHandler(database)({} as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ id: '9', items: [], subtotal: 0, itemCount: 0 });
  });

  it('returns a cart item with Decimal-safe line and subtotal totals', async () => {
    const { database } = createDatabase();
    database.cart.findUnique.mockResolvedValueOnce({
      id: 9n,
      items: [{ id: 17n, quantity: 2, product }],
    });
    const response = createResponse(3n);

    await getCartHandler(database)({} as Request, response, vi.fn());

    expect(response.json).toHaveBeenCalledWith({
      id: '9',
      items: [{
        id: '17',
        quantity: 2,
        product: {
          id: 12,
          name: 'Milk Chocolate Box',
          description: 'Premium milk chocolate gift box.',
          price: 499,
          imageUrl: 'https://example.com/products/milk-chocolate-box.jpg',
        },
        lineTotal: 998,
      }],
      subtotal: 998,
      itemCount: 2,
    });
  });

  it('returns multiple cart items with current product prices and total quantity', async () => {
    const { database } = createDatabase();
    database.cart.findUnique.mockResolvedValueOnce({
      id: 9n,
      items: [
        { id: 17n, quantity: 2, product: { ...product, active: false } },
        {
          id: 18n,
          quantity: 3,
          product: {
            id: 13n,
            name: 'Dark Chocolate Box',
            description: null,
            price: new Decimal('599.00'),
            imageUrl: null,
            active: true,
          },
        },
      ],
    });
    const response = createResponse(3n);

    await getCartHandler(database)({} as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      id: '9',
      items: [
        expect.objectContaining({ id: '17', quantity: 2, lineTotal: 998 }),
        expect.objectContaining({ id: '18', quantity: 3, lineTotal: 1797 }),
      ],
      subtotal: 2795,
      itemCount: 5,
    });
  });

  it('forwards database errors to the shared error handler', async () => {
    const { database } = createDatabase();
    const failure = new Error('database unavailable');
    database.cart.findUnique.mockRejectedValueOnce(failure);
    const response = createResponse(3n);
    const next = vi.fn();

    await getCartHandler(database)({} as Request, response, next);

    expect(next).toHaveBeenCalledWith(failure);
  });
});

describe('PATCH /api/cart/items/:cartItemId handler', () => {
  it('rejects requests without authenticated customer context', async () => {
    const { database } = createDatabase();
    const response = createResponse();

    await getUpdateItemHandler(database)(
      { params: { cartItemId: '17' }, body: { quantity: 5 } } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.cartItem.updateMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it.each([
    [{ cartItemId: 'invalid' }, { quantity: 5 }],
    [{ cartItemId: '0' }, { quantity: 5 }],
    [{ cartItemId: '17' }, {}],
    [{ cartItemId: '17' }, { quantity: 0 }],
    [{ cartItemId: '17' }, { quantity: -1 }],
    [{ cartItemId: '17' }, { quantity: 1.5 }],
    [{ cartItemId: '17' }, { quantity: Number.NaN }],
    [{ cartItemId: '17' }, { quantity: Number.POSITIVE_INFINITY }],
    [{ cartItemId: '17' }, { quantity: '5' }],
    [{ cartItemId: '17' }, { quantity: 2_147_483_648 }],
  ])('rejects invalid path/body %o %o', async (params, body) => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    await getUpdateItemHandler(database)({ params, body } as unknown as Request, response, vi.fn());

    expect(database.cartItem.updateMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: 'A valid cart item ID and positive integer quantity are required.',
    });
  });

  it.each(['missing', 'another customer\'s'])('does not expose a %s cart item', async () => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    await getUpdateItemHandler(database)(
      { params: { cartItemId: '17' }, body: { quantity: 5 } } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.cartItem.updateMany).toHaveBeenCalledWith({
      where: { id: 17n, cart: { customerId: 3n } },
      data: { quantity: 5, updatedAt: expect.any(Date) },
    });
    expect(database.cartItem.findFirst).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: 'Cart item not found.' });
  });

  it('updates an owned cart item and returns its product even when inactive', async () => {
    const { database } = createDatabase();
    database.cartItem.updateMany.mockResolvedValueOnce({ count: 1 });
    database.cartItem.findFirst.mockResolvedValueOnce({
      id: 17n,
      quantity: 5,
      product: { ...product, active: false },
    });
    const response = createResponse(3n);

    await getUpdateItemHandler(database)(
      { params: { cartItemId: '17' }, body: { quantity: 5 } } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.cartItem.findFirst).toHaveBeenCalledWith({
      where: { id: 17n, cart: { customerId: 3n } },
      select: {
        id: true,
        quantity: true,
        product: { select: productSelection },
      },
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      id: '17',
      quantity: 5,
      product: {
        id: 12,
        name: 'Milk Chocolate Box',
        description: 'Premium milk chocolate gift box.',
        price: 499,
        imageUrl: 'https://example.com/products/milk-chocolate-box.jpg',
      },
    });
  });

  it('forwards database errors to the shared error handler', async () => {
    const { database } = createDatabase();
    const failure = new Error('database unavailable');
    database.cartItem.updateMany.mockRejectedValueOnce(failure);
    const response = createResponse(3n);
    const next = vi.fn();

    await getUpdateItemHandler(database)(
      { params: { cartItemId: '17' }, body: { quantity: 5 } } as unknown as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledWith(failure);
  });
});

describe('DELETE /api/cart/items/:cartItemId handler', () => {
  it('rejects requests without authenticated customer context', async () => {
    const { database } = createDatabase();
    const response = createResponse();

    await getRemoveItemHandler(database)(
      { params: { cartItemId: '17' } } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.cartItem.deleteMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it.each(['invalid', '0', '-1'])('rejects invalid cart item ID %s', async (cartItemId) => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    await getRemoveItemHandler(database)(
      { params: { cartItemId } } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.cartItem.deleteMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'A valid cart item ID is required.' });
  });

  it.each(['missing', 'another customer\'s', 'previously removed'])('does not expose a %s cart item', async () => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    await getRemoveItemHandler(database)(
      { params: { cartItemId: '17' } } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { id: 17n, cart: { customerId: 3n } },
    });
    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: 'Cart item not found.' });
  });

  it('removes only the owned cart item and leaves the cart intact', async () => {
    const { database } = createDatabase();
    database.cartItem.deleteMany.mockResolvedValueOnce({ count: 1 });
    const response = createResponse(3n);

    await getRemoveItemHandler(database)(
      { params: { cartItemId: '17' } } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { id: 17n, cart: { customerId: 3n } },
    });
    expect(database.cart.findUnique).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(204);
    expect(response.send).toHaveBeenCalledWith();
  });

  it('forwards database errors to the shared error handler', async () => {
    const { database } = createDatabase();
    const failure = new Error('database unavailable');
    database.cartItem.deleteMany.mockRejectedValueOnce(failure);
    const response = createResponse(3n);
    const next = vi.fn();

    await getRemoveItemHandler(database)(
      { params: { cartItemId: '17' } } as unknown as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledWith(failure);
  });
});

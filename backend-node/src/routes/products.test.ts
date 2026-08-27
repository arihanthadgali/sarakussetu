import { Decimal } from '@prisma/client/runtime/library';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { requireAuthentication } from '../middleware/authentication.js';
import { createProductRouter } from './products.js';

const createResponse = () => {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};

const createDatabase = (products: unknown[]) => ({
  product: {
    findMany: vi.fn().mockResolvedValue(products),
  },
});

const getProductsRoute = (database: ReturnType<typeof createDatabase>) => {
  const router = createProductRouter({ database } as never);
  const route = router.stack.find((layer) => layer.route?.path === '/');

  if (route?.route === undefined) {
    throw new Error('GET / products route not found.');
  }

  const [authenticationHandler, productHandler] = route.route.stack;
  if (authenticationHandler?.handle !== requireAuthentication || productHandler?.handle === undefined) {
    throw new Error('GET / products route does not require authentication.');
  }

  return productHandler.handle;
};

describe('GET /api/products handler', () => {
  it('returns active products ordered by name using the Spring response fields', async () => {
    const database = createDatabase([
      {
        id: 2n,
        name: 'Assorted Chocolate Box',
        description: null,
        price: new Decimal('699.00'),
        imageUrl: null,
      },
      {
        id: 1n,
        name: 'Milk Chocolate Box',
        description: 'Premium milk chocolate gift box.',
        price: new Decimal('499.00'),
        imageUrl: 'https://example.com/products/milk-chocolate-box.jpg',
      },
    ]);
    const response = createResponse();
    const next = vi.fn();

    await getProductsRoute(database)({} as Request, response, next);

    expect(database.product.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
      },
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      {
        id: 2,
        name: 'Assorted Chocolate Box',
        description: null,
        price: 699,
        imageUrl: null,
      },
      {
        id: 1,
        name: 'Milk Chocolate Box',
        description: 'Premium milk chocolate gift box.',
        price: 499,
        imageUrl: 'https://example.com/products/milk-chocolate-box.jpg',
      },
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns an empty array when there are no active products', async () => {
    const database = createDatabase([]);
    const response = createResponse();

    await getProductsRoute(database)({} as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([]);
  });

  it('forwards database failures to the shared error handler', async () => {
    const database = createDatabase([]);
    const failure = new Error('database unavailable');
    database.product.findMany.mockRejectedValueOnce(failure);
    const response = createResponse();
    const next = vi.fn();

    await getProductsRoute(database)({} as Request, response, next);

    expect(next).toHaveBeenCalledWith(failure);
  });
});

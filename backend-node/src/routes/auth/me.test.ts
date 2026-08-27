import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { createAuthenticatedCustomerRouter } from './me.js';

const createResponse = (customerId?: bigint) => {
  const response = {
    locals: customerId === undefined ? {} : { customerId },
    json: vi.fn(),
    status: vi.fn(),
  };

  response.status.mockReturnValue(response);

  return response as unknown as Response;
};

const createDatabase = (customer: { id: bigint; phoneNumber: string } | null) => ({
  customer: {
    findUnique: vi.fn().mockResolvedValue(customer),
  },
});

const getCustomerHandler = (database: ReturnType<typeof createDatabase>) => {
  const router = createAuthenticatedCustomerRouter({ database } as never);
  const route = router.stack.find((layer) => layer.route?.path === '/me');

  if (route?.route === undefined) {
    throw new Error('GET /me route not found.');
  }

  const handler = route.route.stack.at(-1)?.handle;

  if (handler === undefined) {
    throw new Error('GET /me handler not found.');
  }

  return handler;
};

describe('Authenticated customer route', () => {
  it('returns the authenticated customer', async () => {
    const database = createDatabase({
      id: 3n,
      phoneNumber: '+919876543210',
    });
    const response = createResponse(3n);
    const next = vi.fn();

    await getCustomerHandler(database)({} as Request, response, next);

    expect(database.customer.findUnique).toHaveBeenCalledWith({
      where: { id: 3n },
      select: {
        id: true,
        phoneNumber: true,
      },
    });

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      id: '3',
      phoneNumber: '+919876543210',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the customer no longer exists', async () => {
    const database = createDatabase(null);
    const response = createResponse(3n);
    const next = vi.fn();

    await getCustomerHandler(database)({} as Request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
    });
  });

  it('returns 401 when authentication context is missing', async () => {
    const database = createDatabase(null);
    const response = createResponse();
    const next = vi.fn();

    await getCustomerHandler(database)({} as Request, response, next);

    expect(database.customer.findUnique).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
    });
  });
});

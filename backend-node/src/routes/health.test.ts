import type { Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isDatabaseAvailable: vi.fn(),
}));

vi.mock('../database/health.js', () => ({
  isDatabaseAvailable: mocks.isDatabaseAvailable,
}));

import { getHealth } from './health.js';

const createResponse = () => {
  const response = {
    json: vi.fn(),
    status: vi.fn(),
  };
  response.status.mockReturnValue(response);

  return response as unknown as Response;
};

describe('GET /api/health handler', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns UP when the database is available', async () => {
    mocks.isDatabaseAvailable.mockResolvedValueOnce(true);
    const response = createResponse();

    await getHealth({} as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ status: 'UP' });
  });

  it('returns DOWN without database details when the database is unavailable', async () => {
    mocks.isDatabaseAvailable.mockResolvedValueOnce(false);
    const response = createResponse();

    await getHealth({} as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({ status: 'DOWN' });
  });
});

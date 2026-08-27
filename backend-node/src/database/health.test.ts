import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock('./prisma.js', () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}));

import { isDatabaseAvailable } from './health.js';

describe('isDatabaseAvailable', () => {
  it('returns true when the database query succeeds', async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ 1: 1 }]);

    await expect(isDatabaseAvailable()).resolves.toBe(true);
  });

  it('returns false without exposing a database error', async () => {
    mocks.queryRaw.mockRejectedValueOnce(new Error('connection refused'));

    await expect(isDatabaseAvailable()).resolves.toBe(false);
  });
});

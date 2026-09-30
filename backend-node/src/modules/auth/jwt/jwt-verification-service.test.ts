import { describe, expect, it } from 'vitest';

import { createAccessToken } from './access-token-service.js';
import { verifyAccessToken } from './jwt-verification-service.js';

describe('verifyAccessToken', () => {
  it('verifies a valid access token', async () => {
    const token = await createAccessToken(3n);

    const payload = await verifyAccessToken(token);

    expect(payload.sub).toBe('3');
    expect(payload.exp).toBeTypeOf('number');
    expect(payload.iat).toBeTypeOf('number');
  });

  it('rejects a tampered token', async () => {
    const token = await createAccessToken(3n);
    const [header, payload, signature] = token.split('.') as [string, string, string];
    const tamperedPayload = `${payload.slice(0, -1)}${payload.endsWith('a') ? 'b' : 'a'}`;
    const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

    await expect(verifyAccessToken(tamperedToken)).rejects.toThrow();
  });

  it('rejects a malformed token', async () => {
    await expect(verifyAccessToken('not-a-jwt')).rejects.toThrow();
  });
});

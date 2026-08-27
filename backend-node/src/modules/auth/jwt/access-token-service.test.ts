import { createSecretKey } from 'node:crypto';

import { jwtVerify } from 'jose';
import { describe, expect, it } from 'vitest';

import { createAccessToken } from './access-token-service.js';

const testSigningKey = createSecretKey(
  Buffer.from('MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=', 'base64'),
);

describe('createAccessToken', () => {
  it('creates an HS256 token with the customer ID subject and configured expiry', async () => {
    const token = await createAccessToken(42n);
    const { payload, protectedHeader } = await jwtVerify(token, testSigningKey);

    expect(protectedHeader.alg).toBe('HS256');
    expect(payload.sub).toBe('42');
    expect(payload.iat).toBeTypeOf('number');
    expect(payload.exp).toBe((payload.iat as number) + 60 * 60);
  });
});

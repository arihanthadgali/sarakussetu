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
it("rejects a tampered token", async () => {
  const token = await createAccessToken(3n);
  const [header, payload, signature] = token.split(".");

  if (signature === undefined || signature.length === 0) {
    throw new Error("Generated token does not contain a signature.");
  }

  const tamperedSignature = `${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;
  const tamperedToken = `${header}.${payload}.${tamperedSignature}`;

  await expect(verifyAccessToken(tamperedToken)).rejects.toThrow();
});

  it('rejects a malformed token', async () => {
    await expect(verifyAccessToken('not-a-jwt')).rejects.toThrow();
  });
});

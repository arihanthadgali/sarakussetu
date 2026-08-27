import { createSecretKey } from 'node:crypto';

import { jwtVerify, type JWTPayload } from 'jose';

import { env } from '../../../config/env.js';

const getSigningKey = () => {
  const secret = env.JWT_SECRET;

  if (secret === undefined || !/^[A-Za-z0-9+/]+={0,2}$/.test(secret)) {
    throw new Error('JWT_SECRET must be a Base64-encoded key.');
  }

  const key = Buffer.from(secret, 'base64');

  if (key.length < 32) {
    throw new Error('JWT_SECRET must decode to at least 32 bytes.');
  }

  return createSecretKey(key);
};

export const verifyAccessToken = async (token: string): Promise<JWTPayload> => {
  const { payload } = await jwtVerify(token, getSigningKey(), {
    algorithms: ['HS256'],
  });

  return payload;
};

import { createSecretKey } from 'node:crypto';

import { SignJWT } from 'jose';

import { env } from '../../../config/env.js';

const parseAccessTokenTtl = (value: string): number => {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);

  if (match === null) {
    throw new Error('JWT_ACCESS_TOKEN_TTL must be an ISO-8601 duration such as PT1H.');
  }

  const seconds =
    Number(match[1] ?? 0) * 60 * 60 +
    Number(match[2] ?? 0) * 60 +
    Number(match[3] ?? 0);

  if (seconds <= 0) {
    throw new Error('JWT_ACCESS_TOKEN_TTL must be greater than zero.');
  }

  return seconds;
};

const signingKey = () => {
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

export type AccessTokenType = 'RETAILER' | 'WHOLESALER' | 'ADMIN';

export const createAccessToken = async (
  subjectId: bigint,
  tokenType: AccessTokenType = 'RETAILER',
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    tokenType,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(subjectId.toString())
    .setIssuedAt(now)
    .setExpirationTime(
      now + parseAccessTokenTtl(env.JWT_ACCESS_TOKEN_TTL),
    )
    .sign(signingKey());
};

export const createWholesalerSignupToken = async (
  phoneNumber: string,
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    tokenType: 'WHOLESALER_SIGNUP',
    phoneNumber,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('wholesaler-signup')
    .setIssuedAt(now)
    .setExpirationTime(now + 10 * 60)
    .sign(signingKey());
};

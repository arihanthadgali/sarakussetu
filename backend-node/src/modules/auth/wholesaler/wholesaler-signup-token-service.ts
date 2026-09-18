import { jwtVerify } from 'jose';

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

  return key;
};

export const verifyWholesalerSignupToken = async (
  token: string,
): Promise<string | null> => {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: ['HS256'],
    });

    if (payload.sub !== 'wholesaler-signup') {
      return null;
    }

    if (payload.tokenType !== 'WHOLESALER_SIGNUP') {
      return null;
    }

    if (typeof payload.phoneNumber !== 'string') {
      return null;
    }

    return payload.phoneNumber;
  } catch {
    return null;
  }
};

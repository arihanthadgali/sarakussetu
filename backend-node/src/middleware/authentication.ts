import type { RequestHandler } from 'express';

import { verifyAccessToken } from '../modules/auth/jwt/jwt-verification-service.js';

const unauthorized = (response: Parameters<RequestHandler>[1]) =>
  response.status(401).json({ error: 'Unauthorized' });

export const requireAuthentication: RequestHandler = async (request, response, next) => {
  try {
    const authorization = request.get('Authorization');

    if (authorization === undefined) {
      return unauthorized(response);
    }

    const match = /^Bearer ([^\s]+)$/.exec(authorization);

    if (match === null) {
      return unauthorized(response);
    }

    const token = match[1];

    if (token === undefined) {
      return unauthorized(response);
    }

    const payload = await verifyAccessToken(token);
    const subject = payload.sub;

    if (subject === undefined || !/^\d+$/.test(subject)) {
      return unauthorized(response);
    }

    const accountId = BigInt(subject);
    const tokenType = payload.tokenType;

    if (tokenType === 'WHOLESALER') {
      response.locals.wholesalerId = accountId;
      response.locals.role = 'WHOLESALER';
      return next();
    }

    if (tokenType === 'ADMIN') {
      response.locals.adminId = accountId;
      response.locals.role = 'ADMIN';
      return next();
    }

    if (tokenType !== undefined && tokenType !== 'RETAILER') {
      return unauthorized(response);
    }

    response.locals.customerId = accountId;
    response.locals.role = 'RETAILER';

    return next();
  } catch {
    return unauthorized(response);
  }
};

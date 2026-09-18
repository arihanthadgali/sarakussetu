import type { RequestHandler } from "express";

import { prisma } from "../database/prisma.js";
import { isUserRole } from "../modules/auth/authorization/roles.js";
import { verifyAccessToken } from "../modules/auth/jwt/jwt-verification-service.js";

const unauthorized = (response: Parameters<RequestHandler>[1]) =>
  response.status(401).json({ error: "Unauthorized" });

export const requireAuthentication: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const authorization = request.get("Authorization");

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
    const tokenType = payload.tokenType;

    if (subject === undefined || !/^\d+$/.test(subject)) {
      return unauthorized(response);
    }

    const accountId = BigInt(subject);

    if (tokenType === "WHOLESALER") {
      const wholesaler = await prisma.wholesaler.findUnique({
        where: { id: accountId },
        select: {
          id: true,
        },
      });

      if (wholesaler === null) {
        return unauthorized(response);
      }

      response.locals.wholesalerId = wholesaler.id;
      response.locals.role = "WHOLESALER";

      return next();
    }

    if (tokenType !== "RETAILER") {
      return unauthorized(response);
    }

    const customer = await prisma.customer.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        role: true,
      },
    });

    if (customer === null || !isUserRole(customer.role)) {
      return unauthorized(response);
    }

    response.locals.customerId = customer.id;
    response.locals.role = customer.role;

    return next();
  } catch {
    return unauthorized(response);
  }
};
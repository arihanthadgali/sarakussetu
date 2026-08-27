import { Router, type RequestHandler } from 'express';
import type { PrismaClient } from '@prisma/client';

import { prisma } from '../../database/prisma.js';
import { requireAuthentication } from '../../middleware/authentication.js';

type AuthenticatedCustomerRouterDependencies = {
  database?: PrismaClient;
};

export const createAuthenticatedCustomerRouter = ({
  database = prisma,
}: AuthenticatedCustomerRouterDependencies = {}): Router => {
  const router = Router();

  const currentCustomer: RequestHandler = async (_request, response, next) => {
    try {
      const customerId = response.locals.customerId as bigint | undefined;

      if (customerId === undefined) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const customer = await database.customer.findUnique({
        where: {
          id: customerId,
        },
        select: {
          id: true,
          phoneNumber: true,
        },
      });

      if (customer === null) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      return response.status(200).json({
        id: customer.id.toString(),
        phoneNumber: customer.phoneNumber,
      });
    } catch (error) {
      return next(error);
    }
  };

  router.get('/me', requireAuthentication, currentCustomer);

  return router;
};
import type { Prisma, PrismaClient } from '@prisma/client';
import { Router, type RequestHandler } from 'express';

import { prisma } from '../database/prisma.js';
import { requireAuthentication } from '../middleware/authentication.js';

const productSelection = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
} satisfies Prisma.ProductSelect;

type ProductResponse = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

type ProductRouterDependencies = {
  database?: PrismaClient;
};

const toProductResponse = (product: Prisma.ProductGetPayload<{ select: typeof productSelection }>): ProductResponse => ({
  id: Number(product.id),
  name: product.name,
  description: product.description,
  price: product.price.toNumber(),
  imageUrl: product.imageUrl,
});

export const createProductRouter = ({ database = prisma }: ProductRouterDependencies = {}): Router => {
  const router = Router();

  const getActiveProducts: RequestHandler = async (_request, response, next) => {
    try {
      const products = await database.product.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        select: productSelection,
      });

      response.status(200).json(products.map(toProductResponse));
    } catch (error) {
      next(error);
    }
  };

  router.get('/', requireAuthentication, getActiveProducts);
  return router;
};
